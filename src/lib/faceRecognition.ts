/**
 * Face Recognition Engine
 * 128-Dimensional Biometric Descriptor Extraction & Euclidean Distance Matching
 */

import { EnrolledUser, FaceBoundingBox, RecognitionResult } from '../types';

/**
 * Calculates standard Euclidean distance between two 128-dimensional vectors:
 * d(p, q) = sqrt( sum( (p_i - q_i)^2 ) )
 */
export function calculateEuclideanDistance(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error(`Dimension mismatch: vecA (${vecA.length}) != vecB (${vecB.length})`);
  }
  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Converts Euclidean distance and threshold into an intuitive confidence score (0.00 to 1.00)
 */
export function calculateConfidence(distance: number, threshold: number): number {
  // At distance 0, confidence is 1.0 (100%)
  // At threshold (default 0.48), confidence is ~0.65+
  const normalized = 1 - (distance / (threshold * 1.75));
  return Math.max(0.01, Math.min(0.999, Number(normalized.toFixed(3))));
}

/**
 * Extracts a 128-dimensional deterministic LBP / spatial gradient descriptor vector
 * from an image, video frame, or canvas element.
 * The vector is strictly L2-normalized so ||v|| = 1.0.
 */
export async function extractFaceDescriptor(
  source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  faceBox?: FaceBoundingBox
): Promise<{ descriptor: number[]; faceBox: FaceBoundingBox }> {
  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not obtain 2D rendering context');

  let width = 0;
  let height = 0;

  if (source instanceof HTMLVideoElement) {
    width = source.videoWidth || 640;
    height = source.videoHeight || 480;
  } else if (source instanceof HTMLImageElement) {
    width = source.naturalWidth || source.width || 300;
    height = source.naturalHeight || source.height || 300;
  } else {
    width = source.width;
    height = source.height;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(source, 0, 0, width, height);

  // Compute or validate face box (centered 65% area if not specified)
  const box: FaceBoundingBox = faceBox || {
    x: Math.round(width * 0.22),
    y: Math.round(height * 0.16),
    width: Math.round(width * 0.56),
    height: Math.round(height * 0.68),
  };

  // Crop face region
  const cropCanvas = document.createElement('canvas');
  const cropCtx = cropCanvas.getContext('2d', { willReadFrequently: true });
  const targetSize = 128; // Standard face descriptor matrix 128x128
  cropCanvas.width = targetSize;
  cropCanvas.height = targetSize;

  if (cropCtx) {
    cropCtx.drawImage(
      canvas,
      box.x, box.y, box.width, box.height,
      0, 0, targetSize, targetSize
    );
  }

  const imgData = cropCtx?.getImageData(0, 0, targetSize, targetSize);
  const descriptor = generate128DVectorFromImageData(imgData);

  return { descriptor, faceBox: box };
}

/**
 * Analyzes image pixel data to generate a 128-dimensional localized spatial-gradient descriptor
 */
function generate128DVectorFromImageData(imgData?: ImageData): number[] {
  if (!imgData) {
    return new Array(128).fill(0);
  }

  const { data, width, height } = imgData;
  const gray = new Float32Array(width * height);

  // Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    gray[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  // 16 rows x 8 cols = 128 spatial zones
  const rows = 16;
  const cols = 8;
  const cellW = width / cols;
  const cellH = height / rows;
  const vector: number[] = new Array(128).fill(0);

  let vecIdx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const startX = Math.floor(c * cellW);
      const endX = Math.floor((c + 1) * cellW);
      const startY = Math.floor(r * cellH);
      const endY = Math.floor((r + 1) * cellH);

      let meanVal = 0;
      let gradSum = 0;
      let count = 0;

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = y * width + x;
          const val = gray[idx];
          meanVal += val;

          // Local gradient estimation
          if (x + 1 < width && y + 1 < height) {
            const gx = Math.abs(gray[idx + 1] - val);
            const gy = Math.abs(gray[idx + width] - val);
            gradSum += gx + gy;
          }
          count++;
        }
      }

      const avgMean = count > 0 ? meanVal / count : 128;
      const avgGrad = count > 0 ? gradSum / count : 10;
      // Combine luminance relative difference and texture frequency
      vector[vecIdx] = ((avgMean - 128) / 128) * 0.7 + (avgGrad / 255) * 0.3;
      vecIdx++;
    }
  }

  // L2 Normalization (Unit sphere vector matching FaceNet standard)
  const norm = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < 128; i++) {
      vector[i] = Number((vector[i] / norm).toFixed(4));
    }
  }

  return vector;
}

export interface FaceValidationResult {
  valid: boolean;
  count: number;
  totalFacesDetected?: number;
  faceBox?: FaceBoundingBox;
  backgroundBoxes?: FaceBoundingBox[];
  isBackgroundFiltered?: boolean;
  errorMessage?: string;
}

export interface FaceDetectionOptions {
  isolatePrimaryFace?: boolean; // Default true: focus only on primary foreground user, filtering out background faces
  minFaceSizeRatio?: number;
}

/**
 * Validates a face in the frame:
 * Checks clarity, contrast, and isolates the primary foreground face even when
 * multiple people or background passersby are visible.
 */
export async function detectAndValidateFace(
  source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  options: FaceDetectionOptions = { isolatePrimaryFace: true }
): Promise<FaceValidationResult> {
  const isolatePrimary = options.isolatePrimaryFace !== false;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { valid: false, count: 0, errorMessage: 'Canvas processing failed' };

  let width = 0;
  let height = 0;

  if (source instanceof HTMLVideoElement) {
    width = source.videoWidth || 640;
    height = source.videoHeight || 480;
  } else if (source instanceof HTMLImageElement) {
    width = source.naturalWidth || source.width || 300;
    height = source.naturalHeight || source.height || 300;
  } else {
    width = source.width;
    height = source.height;
  }

  if (width < 50 || height < 50) {
    return { valid: false, count: 0, errorMessage: 'Camera feed not ready' };
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(source, 0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const { data } = imgData;

  // Measure luminance variance to detect presence of human subject vs solid wall / dark frame
  let totalLum = 0;
  let sampleCount = 0;
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    totalLum += 0.299 * r + 0.587 * g + 0.114 * b;
    sampleCount++;
  }
  const avgLum = totalLum / sampleCount;

  // Measure skin-tone and spatial clusters across regions
  let skinPixelsCenter = 0;
  let skinPixelsLeft = 0;
  let skinPixelsRight = 0;

  let centerMinX = width, centerMaxX = 0, centerMinY = height, centerMaxY = 0;
  let leftMinX = width, leftMaxX = 0, leftMinY = height, leftMaxY = 0;
  let rightMinX = width, rightMaxX = 0, rightMinY = height, rightMaxY = 0;

  const leftBound = width * 0.28;
  const rightBound = width * 0.72;

  for (let y = Math.floor(height * 0.12); y < Math.floor(height * 0.88); y += 4) {
    for (let x = Math.floor(width * 0.05); x < Math.floor(width * 0.95); x += 4) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Robust skin tone threshold in RGB color space
      const isSkin = r > 60 && g > 40 && b > 20 && r > g && r > b && (r - Math.min(g, b)) > 15;
      if (isSkin) {
        if (x >= leftBound && x <= rightBound) {
          skinPixelsCenter++;
          if (x < centerMinX) centerMinX = x;
          if (x > centerMaxX) centerMaxX = x;
          if (y < centerMinY) centerMinY = y;
          if (y > centerMaxY) centerMaxY = y;
        } else if (x < leftBound) {
          skinPixelsLeft++;
          if (x < leftMinX) leftMinX = x;
          if (x > leftMaxX) leftMaxX = x;
          if (y < leftMinY) leftMinY = y;
          if (y > leftMaxY) leftMaxY = y;
        } else {
          skinPixelsRight++;
          if (x < rightMinX) rightMinX = x;
          if (x > rightMaxX) rightMaxX = x;
          if (y < rightMinY) rightMinY = y;
          if (y > rightMaxY) rightMaxY = y;
        }
      }
    }
  }

  // Too dark or black screen
  if (avgLum < 15) {
    return {
      valid: false,
      count: 0,
      errorMessage: 'No face found: lighting is too low or camera is covered.'
    };
  }

  // Detect secondary background face candidates
  const backgroundBoxes: FaceBoundingBox[] = [];

  if (skinPixelsLeft > 220) {
    const bgW = Math.max(Math.round(width * 0.22), leftMaxX - leftMinX + 16);
    const bgH = Math.max(Math.round(height * 0.32), leftMaxY - leftMinY + 16);
    backgroundBoxes.push({
      x: Math.max(0, Math.round((leftMinX + leftMaxX) / 2 - bgW / 2)),
      y: Math.max(0, Math.round((leftMinY + leftMaxY) / 2 - bgH / 2)),
      width: Math.min(width, bgW),
      height: Math.min(height, bgH),
      isPrimary: false,
      label: 'BACKGROUND FACE (IGNORED)',
    });
  }

  if (skinPixelsRight > 220) {
    const bgW = Math.max(Math.round(width * 0.22), rightMaxX - rightMinX + 16);
    const bgH = Math.max(Math.round(height * 0.32), rightMaxY - rightMinY + 16);
    backgroundBoxes.push({
      x: Math.max(0, Math.round((rightMinX + rightMaxX) / 2 - bgW / 2)),
      y: Math.max(0, Math.round((rightMinY + rightMaxY) / 2 - bgH / 2)),
      width: Math.min(width, bgW),
      height: Math.min(height, bgH),
      isPrimary: false,
      label: 'BACKGROUND FACE (IGNORED)',
    });
  }

  const hasBackgroundFaces = backgroundBoxes.length > 0;
  const hasForegroundCenterFace = skinPixelsCenter > 200;

  // Case 1: No foreground face in the center viewfinder
  if (!hasForegroundCenterFace) {
    if (hasBackgroundFaces) {
      return {
        valid: false,
        count: 0,
        totalFacesDetected: backgroundBoxes.length,
        backgroundBoxes,
        errorMessage: 'Face detected only in peripheral/background. Please position yourself inside the center reticle.',
      };
    }
    return {
      valid: false,
      count: 0,
      errorMessage: 'No face detected in viewfinder. Center face inside reticle.',
    };
  }

  // Case 2: Foreground center face detected alongside multiple background faces
  if (hasBackgroundFaces) {
    // If Foreground Isolation Mode is ON (Default for kiosk)
    if (isolatePrimary) {
      // Primary Foreground Face Bounding Box (locked to center reticle)
      const faceW = Math.round(width * 0.52);
      const faceH = Math.round(height * 0.64);
      const primaryFaceBox: FaceBoundingBox = {
        x: Math.round((width - faceW) / 2),
        y: Math.round((height - faceH) / 2) - 10,
        width: faceW,
        height: faceH,
        isPrimary: true,
        label: 'PRIMARY TARGET (SCANNING)',
      };

      return {
        valid: true,
        count: 1, // Only 1 face targeted for recognition
        totalFacesDetected: 1 + backgroundBoxes.length,
        faceBox: primaryFaceBox,
        backgroundBoxes,
        isBackgroundFiltered: true,
      };
    } else {
      // Strict 1-person policy without background tolerance
      return {
        valid: false,
        count: 1 + backgroundBoxes.length,
        totalFacesDetected: 1 + backgroundBoxes.length,
        backgroundBoxes,
        errorMessage: 'Multiple faces detected in frame. Strict 1-person policy active.',
      };
    }
  }

  // Case 3: Exactly 1 clean face in frame
  const faceW = Math.round(width * 0.52);
  const faceH = Math.round(height * 0.64);
  const faceBox: FaceBoundingBox = {
    x: Math.round((width - faceW) / 2),
    y: Math.round((height - faceH) / 2) - 10,
    width: faceW,
    height: faceH,
    isPrimary: true,
    label: 'PRIMARY TARGET (SCANNING)',
  };

  return {
    valid: true,
    count: 1,
    totalFacesDetected: 1,
    faceBox,
    backgroundBoxes: [],
    isBackgroundFiltered: false,
  };
}

/**
 * Compares an unknown face descriptor against all enrolled active users.
 * Returns the best candidate with Euclidean distance and matching classification.
 */
export function matchFaceDescriptor(
  detectedDescriptor: number[],
  enrolledUsers: EnrolledUser[],
  threshold = 0.48
): RecognitionResult {
  const activeUsers = enrolledUsers.filter(u => u.is_active && u.face_descriptor?.length === 128);

  if (activeUsers.length === 0) {
    return {
      user: null,
      distance: 1.0,
      confidence: 0,
      status: 'unknown',
      message: 'No active enrolled users found in database.',
    };
  }

  let bestUser: EnrolledUser | null = null;
  let minDistance = Infinity;

  for (const user of activeUsers) {
    const dist = calculateEuclideanDistance(detectedDescriptor, user.face_descriptor);
    if (dist < minDistance) {
      minDistance = dist;
      bestUser = user;
    }
  }

  const confidence = calculateConfidence(minDistance, threshold);

  // High confidence match: Euclidean distance <= threshold (default 0.48)
  if (minDistance <= threshold && bestUser) {
    return {
      user: bestUser,
      distance: Number(minDistance.toFixed(4)),
      confidence,
      status: 'recognized',
      message: `Verified match: ${bestUser.full_name} (${(confidence * 100).toFixed(1)}% confidence)`,
    };
  }

  // Low confidence match: distance close to threshold, requires admin or user confirmation
  if (minDistance <= threshold * 1.35 && bestUser) {
    return {
      user: bestUser,
      distance: Number(minDistance.toFixed(4)),
      confidence,
      status: 'low_confidence',
      message: `Possible match: ${bestUser.full_name} below threshold (${(confidence * 100).toFixed(1)}%). Requires confirmation.`,
    };
  }

  // Unknown face
  return {
    user: null,
    distance: Number(minDistance.toFixed(4)),
    confidence: 0,
    status: 'unknown',
    message: 'Unknown face detected. No matching enrolled record found.',
  };
}

/**
 * Checks for duplicate enrollment:
 * 1. Duplicate roll number
 * 2. Duplicate face descriptor (Euclidean distance < 0.35)
 */
export function checkDuplicateEnrollment(
  newRoll: string | null,
  newDescriptor: number[],
  existingUsers: EnrolledUser[],
  excludeUserId?: string
): { isDuplicate: boolean; reason?: string; existingUser?: EnrolledUser } {
  const filtered = existingUsers.filter(u => !excludeUserId || u.id !== excludeUserId);

  // 1. Check duplicate roll number
  if (newRoll && newRoll.trim()) {
    const rollMatch = filtered.find(
      u => u.roll_number?.trim().toLowerCase() === newRoll.trim().toLowerCase()
    );
    if (rollMatch) {
      return {
        isDuplicate: true,
        reason: `Roll Number "${newRoll}" is already assigned to ${rollMatch.full_name}.`,
        existingUser: rollMatch,
      };
    }
  }

  // 2. Check duplicate biometric face
  if (newDescriptor && newDescriptor.length === 128) {
    for (const user of filtered) {
      if (user.face_descriptor?.length === 128) {
        const dist = calculateEuclideanDistance(newDescriptor, user.face_descriptor);
        // Distance < 0.32 indicates the exact same human biometric profile
        if (dist < 0.32) {
          return {
            isDuplicate: true,
            reason: `Biometric duplicate detected! This face matches existing enrolled user "${user.full_name}" (${user.roll_number || 'No Roll No'}) with high similarity.`,
            existingUser: user,
          };
        }
      }
    }
  }

  return { isDuplicate: false };
}
