import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  Lock
} from 'lucide-react';
import { EnrolledUser, UserRole } from '../types';
import { 
  detectAndValidateFace, 
  extractFaceDescriptor, 
  checkDuplicateEnrollment 
} from '../lib/faceRecognition';
import { dataService } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface UserEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingUsers: EnrolledUser[];
  onUserEnrolled: (user: EnrolledUser) => void;
}

export const UserEnrollmentModal: React.FC<UserEnrollmentModalProps> = ({
  isOpen,
  onClose,
  existingUsers,
  onUserEnrolled,
}) => {
  const { currentProfile, isAdmin } = useAuth();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Electronics & Telecommunication');
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [notes, setNotes] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  // Photo & Biometrics State
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [isValidatingFace, setIsValidatingFace] = useState(false);
  const [faceValidationStatus, setFaceValidationStatus] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  // Live Camera Capture
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Feedback Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Stop webcam on close
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsWebcamActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopWebcam();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFullName('');
    setRollNumber('');
    setEmail('');
    setPhone('');
    setDepartment('Electronics & Telecommunication');
    setUserRole('student');
    setNotes('');
    setConsentGiven(false);
    setCapturedImage(null);
    setFaceDescriptor(null);
    setFaceValidationStatus(null);
    setErrorMessage(null);
  };

  /**
   * Start Webcam inside enrollment modal
   */
  const startWebcam = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsWebcamActive(true);
    } catch (err) {
      setErrorMessage('Could not activate webcam. You can also upload a photo from your device.');
    }
  };

  /**
   * Snap photo from webcam
   */
  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally for natural mirror selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopWebcam();
    setCapturedImage(dataUrl);
    await validateAndExtractImage(dataUrl);
  };

  /**
   * Handle image file upload
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      await validateAndExtractImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Validate image contains exactly one clear face and extract 128-d vector
   */
  const validateAndExtractImage = async (dataUrl: string) => {
    setIsValidatingFace(true);
    setErrorMessage(null);
    setFaceValidationStatus(null);

    const img = new Image();
    img.src = dataUrl;
    img.onload = async () => {
      try {
        const validation = await detectAndValidateFace(img);
        if (!validation.valid) {
          setFaceValidationStatus({
            valid: false,
            message: validation.errorMessage || 'Invalid face image.',
          });
          setFaceDescriptor(null);
        } else {
          const { descriptor } = await extractFaceDescriptor(img, validation.faceBox);
          setFaceDescriptor(descriptor);
          setFaceValidationStatus({
            valid: true,
            message: 'Face verified successfully: Exactly 1 distinct face detected. 128-d descriptor vector synthesized.',
          });
        }
      } catch (err: any) {
        setFaceValidationStatus({
          valid: false,
          message: 'Analysis failed: ' + err.message,
        });
      } finally {
        setIsValidatingFace(false);
      }
    };
  };

  /**
   * Remove image and retake
   */
  const removeImage = () => {
    setCapturedImage(null);
    setFaceDescriptor(null);
    setFaceValidationStatus(null);
  };

  /**
   * Submit Enrollment
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAdmin) {
      setErrorMessage('Access denied: Only users with the Admin role can enroll new biometric subjects.');
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (!capturedImage || !faceDescriptor) {
      setErrorMessage('A verified biometric face photo is required for enrollment.');
      return;
    }

    if (!faceValidationStatus?.valid) {
      setErrorMessage('Biometric verification failed. Image must contain exactly one clearly visible face.');
      return;
    }

    if (!consentGiven) {
      setErrorMessage('Subject biometric consent is legally required before storing face descriptors.');
      return;
    }

    // Duplicate detection
    const duplicateCheck = checkDuplicateEnrollment(
      rollNumber || null,
      faceDescriptor,
      existingUsers
    );

    if (duplicateCheck.isDuplicate) {
      setErrorMessage(duplicateCheck.reason || 'Duplicate record detected.');
      return;
    }

    setIsSaving(true);
    try {
      const newUser = await dataService.enrollUser(
        {
          full_name: fullName.trim(),
          roll_number: rollNumber.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          department: department.trim() || null,
          user_role: userRole,
          notes: notes.trim() || null,
          photo_url: capturedImage,
          face_descriptor: faceDescriptor,
          consent_at: new Date().toISOString(),
          is_active: true,
        },
        currentProfile
      );

      onUserEnrolled(newUser);
      onClose();
    } catch (err: any) {
      setErrorMessage('Failed to enroll user: ' + (err.message || 'Database error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center space-x-3">
            <div 
              className="w-9 h-9 rounded-lg flex items-center justify-center border"
              style={{ borderColor: 'var(--accent)', background: 'var(--accent-soft)' }}
            >
              <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Enroll New Biometric User</h2>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Capture photo, synthesize 128-d descriptor, and record consent
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border hover:opacity-80 transition-colors"
            style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-xs text-red-500 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Top Section: Biometric Photo Capture & Validation */}
          <div>
            <label className="block text-xs font-semibold mono uppercase mb-2" style={{ color: 'var(--text)' }}>
              1. Biometric Face Capture <span className="text-red-500">*</span>
            </label>

            {!capturedImage && !isWebcamActive && (
              <div 
                className="border-2 border-dashed rounded-xl p-6 text-center space-y-3"
                style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}
              >
                <div className="flex justify-center space-x-3">
                  <button
                    type="button"
                    onClick={startWebcam}
                    className="px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 border transition-all"
                    style={{ background: 'var(--accent)', color: '#0a0e13' }}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Open Camera</span>
                  </button>

                  <label className="cursor-pointer px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 border hover:opacity-80 transition-all"
                         style={{ borderColor: 'var(--line)', background: 'var(--panel)', color: 'var(--text)' }}>
                    <Upload className="w-4 h-4" />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                  Face must be well lit, looking directly at camera, with no sunglasses or heavy masks.
                </p>
              </div>
            )}

            {/* Active Webcam View */}
            {isWebcamActive && (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-black max-h-[300px] flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
                
                {/* Targeting HUD */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-56 rounded-xl border-2 border-dashed" style={{ borderColor: 'var(--accent)' }}>
                    <div className="bracket b-tl" />
                    <div className="bracket b-tr" />
                    <div className="bracket b-bl" />
                    <div className="bracket b-br" />
                  </div>
                </div>

                {/* Webcam Controls */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-3 z-10">
                  <button
                    type="button"
                    onClick={stopWebcam}
                    className="px-3 py-1.5 rounded-lg text-xs bg-gray-800 text-white hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-lg"
                    style={{ background: 'var(--accent)', color: '#0a0e13' }}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Snapshot</span>
                  </button>
                </div>
              </div>
            )}

            {/* Captured Image Preview & Validation Status */}
            {capturedImage && (
              <div className="p-4 rounded-xl border flex flex-col sm:flex-row items-center gap-4" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
                <div className="relative w-28 h-28 rounded-lg overflow-hidden border flex-shrink-0" style={{ borderColor: 'var(--line)' }}>
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                  <div className="bracket b-tl !w-2 !h-2" />
                  <div className="bracket b-tr !w-2 !h-2" />
                  <div className="bracket b-bl !w-2 !h-2" />
                  <div className="bracket b-br !w-2 !h-2" />
                </div>

                <div className="flex-1 space-y-2 text-xs">
                  {isValidatingFace ? (
                    <div className="flex items-center space-x-2" style={{ color: 'var(--accent)' }}>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Validating face count & synthesizing 128-d descriptor...</span>
                    </div>
                  ) : faceValidationStatus ? (
                    <div className={`p-2.5 rounded-lg border text-xs flex items-start space-x-2 ${
                      faceValidationStatus.valid 
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : 'border-red-500/40 bg-red-500/10 text-red-500'
                    }`}>
                      {faceValidationStatus.valid ? (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold">{faceValidationStatus.valid ? 'Biometric Quality Passed' : 'Face Validation Error'}</p>
                        <p className="text-[11px] opacity-90">{faceValidationStatus.message}</p>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={removeImage}
                      className="px-3 py-1 rounded border text-xs flex items-center space-x-1 hover:opacity-80"
                      style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Retake / Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Information Fields */}
          <div>
            <label className="block text-xs font-semibold mono uppercase mb-2" style={{ color: 'var(--text)' }}>
              2. User Profile Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block mb-1 font-medium">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rishi Jain"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-transparent font-medium"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Roll Number / Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. BTEL26O1098"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-lg border bg-transparent mono"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  placeholder="user@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-transparent"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-transparent mono"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-transparent"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                >
                  <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Administration & Faculty">Administration & Faculty</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">User Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-lg border bg-transparent"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff / Faculty</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1 font-medium">Profile Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Cohort 2026, Section B"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border bg-transparent"
                  style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
                />
              </div>
            </div>
          </div>

          {/* Biometric Consent Agreement */}
          <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}>
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="consent-checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 rounded border-gray-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="consent-checkbox" className="text-xs cursor-pointer" style={{ color: 'var(--text)' }}>
                <span className="font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span>Mandatory Biometric Enrollment Consent</span>
                </span>
                <span className="text-[11px] block mt-1 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  I hereby confirm explicit subject consent to extract and securely store a mathematical 128-dimensional
                  facial descriptor vector solely for authorized attendance verification. No raw biometric templates
                  will be shared or utilized for unauthorized surveillance.
                </span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t" style={{ borderColor: 'var(--line)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold border hover:opacity-80 transition-colors"
              style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || !faceValidationStatus?.valid || !consentGiven}
              className="px-5 py-2 rounded-lg text-xs font-bold flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              style={{
                background: 'var(--accent)',
                color: '#0a0e13',
              }}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Save Biometric Enrollment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
