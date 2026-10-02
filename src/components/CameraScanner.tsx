import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  UserCheck, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  ShieldAlert,
  Upload,
  UserX,
  Lock,
  Clock,
  LogIn,
  LogOut,
  Crosshair,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EnrolledUser, RecognitionResult, ScannerStatus, ScannerSettings, FaceBoundingBox } from '../types';
import { 
  extractFaceDescriptor, 
  detectAndValidateFace, 
  matchFaceDescriptor 
} from '../lib/faceRecognition';
import { dataService } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { biometricAudio } from '../lib/audioFeedback';

interface CameraScannerProps {
  enrolledUsers: EnrolledUser[];
  onAttendanceMarked: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  enrolledUsers,
  onAttendanceMarked,
}) => {
  const { currentProfile, isAdmin } = useAuth();

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Camera is off. Click "Start Camera" to begin scanning.');
  
  // Settings
  const [settings, setSettings] = useState<ScannerSettings>({
    confidenceThreshold: 0.48,
    autoMarkAttendance: true,
    soundEnabled: true,
    minFaceSizeRatio: 0.15,
    singleFaceIsolation: true, // Only scan one foreground face even when multiple faces seen in background
  });
  const [showSettings, setShowSettings] = useState(false);

  // Background face filtering & single target isolation state
  const [detectedBackgroundBoxes, setDetectedBackgroundBoxes] = useState<FaceBoundingBox[]>([]);
  const [isBgFilteredActive, setIsBgFilteredActive] = useState<boolean>(false);

  // Recognition Results
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [lastMarkedUser, setLastMarkedUser] = useState<EnrolledUser | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [pendingLowConfidenceUser, setPendingLowConfidenceUser] = useState<{
    user: EnrolledUser;
    confidence: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [punchMode, setPunchMode] = useState<'in' | 'out'>('in');

  // Sonar sound effect & target lock tracking
  const wasFaceDetectedRef = useRef(false);
  const lastSonarTimeRef = useRef(0);
  const [isSonarRippling, setIsSonarRippling] = useState(false);

  // Sync sound settings with audio synthesizer
  useEffect(() => {
    biometricAudio.setSoundEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  /**
   * Start Webcam
   */
  const startCamera = async () => {
    setScannerStatus('initializing');
    setStatusMessage('Accessing biometric video sensor...');
    setDuplicateWarning(null);
    setPendingLowConfidenceUser(null);
    biometricAudio.unlockAudio();
    biometricAudio.setSoundEnabled(settings.soundEnabled);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
      setScannerStatus('searching');
      setStatusMessage('Sensor ready. Position your face inside the targeting frame.');
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setScannerStatus('permission_denied');
        setStatusMessage('Camera permission denied. Please enable camera access in your browser settings.');
      } else {
        setScannerStatus('camera_unavailable');
        setStatusMessage('Camera unavailable or disconnected. Check hardware connections.');
      }
    }
  };

  /**
   * Stop Webcam
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsCameraActive(false);
    setScannerStatus('idle');
    setStatusMessage('Camera stopped.');
    setRecognitionResult(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  /**
   * Play simple biometric feedback chime using Web Audio API
   */
  const playBeep = (type: 'success' | 'alert') => {
    if (!settings.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // Audio context might be restricted
    }
  };

  /**
   * Run Biometric Recognition on current frame
   */
  const captureAndAnalyzeFrame = useCallback(async () => {
    if (!videoRef.current || videoRef.current.readyState < 2 || isProcessing) {
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Detect and validate face count & quality (with single foreground face isolation)
      const validation = await detectAndValidateFace(videoRef.current, {
        isolatePrimaryFace: settings.singleFaceIsolation,
      });

      if (!validation.valid) {
        wasFaceDetectedRef.current = false;
        setDetectedBackgroundBoxes(validation.backgroundBoxes || []);
        setIsBgFilteredActive(false);
        if (validation.count === 0) {
          setScannerStatus('no_face');
          setStatusMessage(validation.errorMessage || 'No face detected in viewfinder.');
        } else if (validation.count > 1) {
          setScannerStatus('multiple_faces');
          setStatusMessage(validation.errorMessage || 'Multiple faces detected. Attendance requires exactly one person.');
        }
        setRecognitionResult(null);
        setIsProcessing(false);
        return;
      }

      // Store detected background face boxes and filtered status
      setDetectedBackgroundBoxes(validation.backgroundBoxes || []);
      setIsBgFilteredActive(Boolean(validation.isBackgroundFiltered));

      // Valid face successfully acquired in viewfinder!
      // Trigger subtle, high-tech sonar beep upon target acquisition
      const now = Date.now();
      if (!wasFaceDetectedRef.current || now - lastSonarTimeRef.current > 2200) {
        if (settings.soundEnabled) {
          biometricAudio.playSonarPing();
        }
        setIsSonarRippling(true);
        setTimeout(() => setIsSonarRippling(false), 700);
        lastSonarTimeRef.current = now;
      }
      wasFaceDetectedRef.current = true;

      // 2. Extract 128-d descriptor vector (strictly cropped to primary foreground face)
      const { descriptor, faceBox } = await extractFaceDescriptor(
        videoRef.current,
        validation.faceBox
      );

      // 3. Match against enrolled users database
      const match = matchFaceDescriptor(descriptor, enrolledUsers, settings.confidenceThreshold);
      match.faceBox = faceBox;
      match.backgroundFaceBoxes = validation.backgroundBoxes;
      match.ignoredBackgroundCount = validation.backgroundBoxes?.length || 0;
      setRecognitionResult(match);

      if (match.status === 'recognized' && match.user) {
        setScannerStatus('recognized');
        const bgSuffix = validation.isBackgroundFiltered && validation.backgroundBoxes?.length
          ? ` • (${validation.backgroundBoxes.length} background face filtered)`
          : '';
        setStatusMessage(match.message + bgSuffix);

        // Auto mark attendance if enabled and not already marked this frame
        if (settings.autoMarkAttendance && lastMarkedUser?.id !== match.user.id) {
          await handleMarkAttendance(match.user, match.confidence, false);
        }
      } else if (match.status === 'low_confidence' && match.user) {
        setScannerStatus('low_confidence');
        setStatusMessage(`Low confidence match (${(match.confidence * 100).toFixed(1)}%). Requires confirmation.`);
        setPendingLowConfidenceUser({ user: match.user, confidence: match.confidence });
      } else {
        setScannerStatus('unknown_face');
        const bgSuffix = validation.isBackgroundFiltered && validation.backgroundBoxes?.length
          ? ` • (${validation.backgroundBoxes.length} background face ignored)`
          : '';
        setStatusMessage('Unknown face. No matching enrolled biometric descriptor found.' + bgSuffix);
      }
    } catch (err) {
      console.error('Recognition error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [enrolledUsers, settings, isProcessing, lastMarkedUser]);

  // Periodic frame scanner loop when camera is active
  useEffect(() => {
    if (isCameraActive) {
      scanIntervalRef.current = window.setInterval(() => {
        captureAndAnalyzeFrame();
      }, 1000);
    } else {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [isCameraActive, captureAndAnalyzeFrame]);

  /**
   * Save Attendance Record
   */
  const handleMarkAttendance = async (
    user: EnrolledUser,
    confidence: number,
    isOverride = false
  ) => {
    // 1. Lock Condition Verification (Passkey required to unlock)
    if (user.is_locked) {
      if (settings.soundEnabled) {
        biometricAudio.playAlert();
      }
      playBeep('alert');
      setDuplicateWarning(
        `🚨 REPOSITORY SECURITY HOLD: Profile for "${user.full_name}" is LOCKED (${user.locked_reason ? user.locked_reason.replace(/\s*\(Password:\s*mars\)/gi, '') : 'Repository Lockdown'}). Attendance blocked. Profile must be unlocked with Master Passkey.`
      );
      setStatusMessage(`REPOSITORY LOCK: Profile for ${user.full_name} is locked.`);
      return;
    }

    setDuplicateWarning(null);
    const res = await dataService.markAttendance(
      user.id,
      confidence,
      'face',
      currentProfile,
      isOverride,
      punchMode
    );

    if (res.success) {
      setLastMarkedUser(user);
      setPendingLowConfidenceUser(null);
      if (settings.soundEnabled) {
        biometricAudio.playAttendanceSuccess();
      }
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#0f9d6e', '#49ffc0', '#22c55e'],
      });
      onAttendanceMarked();
    } else {
      if (settings.soundEnabled) {
        biometricAudio.playAlert();
      }
      setDuplicateWarning(res.message);
    }
  };

  /**
   * Static File Upload Scanner (Fallback for testing without webcam)
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      setScannerStatus('searching');
      setStatusMessage('Analyzing uploaded biometric photo...');
      
      const validation = await detectAndValidateFace(img, {
        isolatePrimaryFace: settings.singleFaceIsolation,
      });
      if (!validation.valid) {
        setScannerStatus(validation.count > 1 ? 'multiple_faces' : 'no_face');
        setStatusMessage(validation.errorMessage || 'Invalid face photo.');
        setDetectedBackgroundBoxes(validation.backgroundBoxes || []);
        return;
      }

      setDetectedBackgroundBoxes(validation.backgroundBoxes || []);
      setIsBgFilteredActive(Boolean(validation.isBackgroundFiltered));

      const { descriptor, faceBox } = await extractFaceDescriptor(img, validation.faceBox);
      const match = matchFaceDescriptor(descriptor, enrolledUsers, settings.confidenceThreshold);
      match.faceBox = faceBox;
      match.backgroundFaceBoxes = validation.backgroundBoxes;
      match.ignoredBackgroundCount = validation.backgroundBoxes?.length || 0;
      setRecognitionResult(match);

      if (match.status === 'recognized' && match.user) {
        setScannerStatus('recognized');
        const bgSuffix = validation.isBackgroundFiltered && validation.backgroundBoxes?.length
          ? ` • (${validation.backgroundBoxes.length} background face filtered)`
          : '';
        setStatusMessage(match.message + bgSuffix);
        await handleMarkAttendance(match.user, match.confidence, false);
      } else if (match.status === 'low_confidence' && match.user) {
        setScannerStatus('low_confidence');
        setStatusMessage(match.message);
        setPendingLowConfidenceUser({ user: match.user, confidence: match.confidence });
      } else {
        setScannerStatus('unknown_face');
        setStatusMessage('Unknown face photo.');
      }
    };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Header & Threshold Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
        <div>
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <span>Biometric Recognition Kiosk</span>
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            128-dimensional Euclidean distance matching against {enrolledUsers.filter(u => u.is_active).length} enrolled profiles
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Shift Punch Mode Selector */}
          <div className="flex rounded-lg border p-0.5 text-xs font-semibold" style={{ borderColor: 'var(--line)' }}>
            <button
              onClick={() => setPunchMode('in')}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 transition-colors ${
                punchMode === 'in'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Record as Punch In (Shift Start)"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Punch IN</span>
            </button>
            <button
              onClick={() => setPunchMode('out')}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 transition-colors ${
                punchMode === 'out'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Record as Punch Out (Shift End)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Punch OUT</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            id="btn-toggle-scanner-sound"
            onClick={() => {
              setSettings(s => {
                const next = !s.soundEnabled;
                biometricAudio.setSoundEnabled(next);
                if (next) {
                  biometricAudio.unlockAudio();
                  biometricAudio.playSonarPing();
                }
                return { ...s, soundEnabled: next };
              });
            }}
            className="p-2 rounded-lg border hover:opacity-80 transition-colors"
            style={{ borderColor: 'var(--line)', color: settings.soundEnabled ? 'var(--accent)' : 'var(--text-dim)' }}
            title={settings.soundEnabled ? 'Mute Sonar & Audio Chimes' : 'Enable Sonar & Audio Chimes (Click to test sound)'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Single-Face Foreground Isolation Toggle */}
          <button
            id="btn-toggle-single-face-isolation"
            onClick={() => setSettings(s => ({ ...s, singleFaceIsolation: !s.singleFaceIsolation }))}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              settings.singleFaceIsolation
                ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-sm'
                : 'hover:opacity-80 text-gray-400 border-line'
            }`}
            style={{ borderColor: settings.singleFaceIsolation ? '#38bdf8' : 'var(--line)' }}
            title={
              settings.singleFaceIsolation
                ? '1-Face Isolation: Active (Camera only scans the primary foreground user while ignoring background faces)'
                : '1-Face Isolation: Disabled (Strict mode, errors on any background face)'
            }
          >
            <Crosshair className={`w-3.5 h-3.5 ${settings.singleFaceIsolation ? 'text-cyan-400' : 'text-gray-400'}`} />
            <span className="hidden sm:inline">1-Face Focus:</span>
            <span className={`px-1 rounded text-[10px] mono uppercase font-bold ${settings.singleFaceIsolation ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-gray-400'}`}>
              {settings.singleFaceIsolation ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Config Settings Toggle */}
          <button
            id="btn-toggle-scanner-settings"
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1.5 rounded-lg border text-xs mono flex items-center space-x-1.5 hover:opacity-80 transition-colors"
            style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Threshold: {settings.confidenceThreshold.toFixed(2)}</span>
          </button>

          {/* Start/Stop Camera Button */}
          {!isCameraActive ? (
            <button
              id="btn-start-camera"
              onClick={startCamera}
              className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all shadow-md"
              style={{
                background: 'var(--accent)',
                color: '#0a0e13',
              }}
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </button>
          ) : (
            <button
              id="btn-stop-camera"
              onClick={stopCamera}
              className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 transition-all bg-red-600 text-white hover:bg-red-700"
            >
              <CameraOff className="w-4 h-4" />
              <span>Stop Camera</span>
            </button>
          )}
        </div>
      </div>

      {/* Threshold Configuration Drawer */}
      {showSettings && (
        <div className="p-4 rounded-xl border space-y-4" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold mono uppercase">Biometric Match Parameters</span>
            <button onClick={() => setShowSettings(false)} className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span>Confidence Threshold (Max Euclidean Distance)</span>
                <span className="mono font-bold" style={{ color: 'var(--accent)' }}>
                  {settings.confidenceThreshold.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.80"
                step="0.02"
                value={settings.confidenceThreshold}
                onChange={(e) => setSettings(s => ({ ...s, confidenceThreshold: parseFloat(e.target.value) }))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[11px] block mt-1" style={{ color: 'var(--text-dim)' }}>
                Default is 0.48. Lower = stricter face matching; Higher = looser matching.
              </span>
            </div>

            <div className="flex flex-col justify-center space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoMarkAttendance}
                  onChange={(e) => setSettings(s => ({ ...s, autoMarkAttendance: e.target.checked }))}
                  className="rounded border-gray-400 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Auto-mark attendance instantly upon high confidence match</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.singleFaceIsolation}
                  onChange={(e) => setSettings(s => ({ ...s, singleFaceIsolation: e.target.checked }))}
                  className="rounded border-gray-400 text-cyan-600 focus:ring-cyan-500"
                />
                <span>Isolate single foreground face (ignore background people & passersby)</span>
              </label>

              <div className="flex items-center space-x-2 pt-1">
                <label className="cursor-pointer px-3 py-1.5 rounded border text-xs mono flex items-center space-x-1 hover:opacity-80" style={{ borderColor: 'var(--line)' }}>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Test Photo from File</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Viewfinder Stage */}
      <div className="relative aspect-video max-h-[500px] w-full rounded-2xl overflow-hidden border shadow-xl flex items-center justify-center"
           style={{ background: '#0a0e13', borderColor: 'var(--line)' }}>
        
        {/* Background Grid Accent */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#49ffc0 1px, transparent 1px), linear-gradient(90deg, #49ffc0 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${
            !isCameraActive ? 'hidden' : 'block'
          }`}
        />

        {/* Inactive Camera Placeholder */}
        {!isCameraActive && (
          <div className="text-center p-8 z-10 max-w-md">
            <div 
              className="w-20 h-20 mx-auto mb-4 rounded-2xl border flex items-center justify-center"
              style={{ borderColor: 'var(--accent-line)', background: 'var(--accent-soft)' }}
            >
              <Camera className="w-10 h-10" style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Camera is Offline</h3>
            <p className="text-sm text-gray-400 mb-6">
              Click the button below to enable the biometric camera scanner and detect enrolled faces in real-time.
            </p>
            <button
              id="btn-stage-start-camera"
              onClick={startCamera}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg inline-flex items-center space-x-2"
              style={{ background: 'var(--accent)', color: '#0a0e13' }}
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera Scanner</span>
            </button>
          </div>
        )}

        {/* Active HUD Overlays */}
        {isCameraActive && (
          <>
            {/* Scanline Sweep Animation */}
            <div className="scanline" />

            {/* Central Biometric Targeting Reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div 
                className="w-72 h-80 sm:w-80 sm:h-96 rounded-2xl relative border transition-all duration-300"
                style={{
                  borderColor: scannerStatus === 'recognized' 
                    ? '#22c55e' 
                    : scannerStatus === 'unknown_face' || scannerStatus === 'multiple_faces'
                    ? '#ef4444'
                    : 'var(--accent-line)',
                  boxShadow: scannerStatus === 'recognized'
                    ? '0 0 30px rgba(34, 197, 94, 0.4)'
                    : '0 0 20px var(--accent-soft)',
                }}
              >
                {/* 4 Corner Targeting Brackets */}
                <div className="bracket b-tl !w-6 !h-6 !border-t-4 !border-l-4" />
                <div className="bracket b-tr !w-6 !h-6 !border-t-4 !border-r-4" />
                <div className="bracket b-bl !w-6 !h-6 !border-b-4 !border-l-4" />
                <div className="bracket b-br !w-6 !h-6 !border-b-4 !border-r-4" />

                {/* Sonar Ping Wave Pulse Animation (Triggers on Face Detection) */}
                {isSonarRippling && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div 
                      className="w-36 h-36 rounded-full border-2 animate-ping"
                      style={{ borderColor: 'var(--accent)', opacity: 0.7 }}
                    />
                    <div 
                      className="w-18 h-18 rounded-full animate-pulse"
                      style={{ background: 'var(--accent-soft)' }}
                    />
                  </div>
                )}

                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <div className="w-4 h-0.5 bg-emerald-400" />
                  <div className="h-4 w-0.5 bg-emerald-400 absolute" />
                </div>
              </div>
            </div>

            {/* Secondary Background Face Markers (Visual indication when multiple faces seen in background) */}
            {settings.singleFaceIsolation && detectedBackgroundBoxes.map((bgBox, idx) => {
              const vidW = videoRef.current?.videoWidth || 640;
              const vidH = videoRef.current?.videoHeight || 480;
              const leftPct = Math.max(0, Math.min(80, (bgBox.x / vidW) * 100));
              const topPct = Math.max(0, Math.min(80, (bgBox.y / vidH) * 100));
              const widthPct = Math.min(30, (bgBox.width / vidW) * 100);
              const heightPct = Math.min(40, (bgBox.height / vidH) * 100);
              return (
                <div
                  key={idx}
                  className="absolute rounded-xl border border-dashed pointer-events-none transition-all duration-300 flex flex-col items-center justify-start p-1.5"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                    borderColor: 'rgba(234, 179, 8, 0.75)',
                    background: 'rgba(234, 179, 8, 0.08)',
                  }}
                >
                  <span className="px-1.5 py-0.5 rounded text-[9px] mono uppercase font-bold bg-black/85 border border-yellow-500/50 text-yellow-300 shadow">
                    BG Ignored
                  </span>
                </div>
              );
            })}

            {/* Top HUD Status Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 rounded-md text-xs mono backdrop-blur-md bg-black/60 border border-white/10 text-white flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${isSonarRippling ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                  <span>{isSonarRippling ? 'TARGET ACQUIRED • SONAR PING' : 'LIVE SENSOR ACTIVE'}</span>
                </div>

                {settings.singleFaceIsolation && isBgFilteredActive && detectedBackgroundBoxes.length > 0 && (
                  <div className="px-2.5 py-1 rounded-md text-[11px] mono backdrop-blur-md bg-amber-950/85 border border-yellow-500/50 text-yellow-300 flex items-center space-x-1.5 animate-pulse">
                    <Crosshair className="w-3 h-3 text-yellow-400" />
                    <span>1 FOREGROUND LOCKED &bull; {detectedBackgroundBoxes.length} BG FILTERED</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {settings.singleFaceIsolation && (
                  <div className="hidden sm:flex px-2 py-1 rounded-md text-[10px] mono backdrop-blur-md bg-cyan-950/60 border border-cyan-400/30 text-cyan-300 items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>1-Face Focus: ON</span>
                  </div>
                )}
                <div className="px-3 py-1 rounded-md text-xs mono backdrop-blur-md bg-black/60 border border-white/10 text-emerald-400 flex items-center space-x-1.5">
                  <Volume2 className={`w-3.5 h-3.5 ${isSonarRippling ? 'text-cyan-300 animate-bounce' : 'text-emerald-400'}`} />
                  <span>EUCLIDEAN &le; {settings.confidenceThreshold.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Bottom Status Ticker */}
            <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
              <div 
                className="p-3 rounded-xl backdrop-blur-md border text-xs sm:text-sm font-medium flex items-center space-x-3 transition-all"
                style={{
                  background: scannerStatus === 'recognized' 
                    ? 'rgba(15, 157, 110, 0.85)' 
                    : scannerStatus === 'unknown_face' || scannerStatus === 'multiple_faces'
                    ? 'rgba(220, 38, 38, 0.85)'
                    : 'rgba(19, 26, 33, 0.85)',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                }}
              >
                {scannerStatus === 'recognized' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                {scannerStatus === 'low_confidence' && <AlertTriangle className="w-5 h-5 flex-shrink-0 text-yellow-400" />}
                {(scannerStatus === 'unknown_face' || scannerStatus === 'multiple_faces') && <XCircle className="w-5 h-5 flex-shrink-0" />}
                {scannerStatus === 'searching' && <RefreshCw className="w-4 h-4 flex-shrink-0 animate-spin text-emerald-400" />}
                {scannerStatus === 'no_face' && <Camera className="w-4 h-4 flex-shrink-0 text-gray-400" />}
                
                <span className="truncate">{statusMessage}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Duplicate Warning Dialog (With Admin Override) */}
      {duplicateWarning && (
        <div className="p-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 space-y-3">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">
              <p className="font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                Attendance Already Logged Today
              </p>
              <p style={{ color: 'var(--text)' }}>{duplicateWarning}</p>
            </div>
          </div>

          {isAdmin && lastMarkedUser && (
            <div className="flex justify-end space-x-2 pt-1 border-t border-yellow-500/20">
              <button
                onClick={() => setDuplicateWarning(null)}
                className="px-3 py-1.5 rounded text-xs border"
                style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}
              >
                Dismiss
              </button>
              <button
                id="btn-admin-override-duplicate"
                onClick={() => handleMarkAttendance(lastMarkedUser, 1.0, true)}
                className="px-3 py-1.5 rounded text-xs font-bold bg-yellow-600 text-white hover:bg-yellow-700"
              >
                Admin Override: Log Duplicate Entry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Low Confidence Confirmation Prompt */}
      {pendingLowConfidenceUser && (
        <div className="p-4 rounded-xl border border-orange-500/40 bg-orange-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-6 h-6 text-orange-500" />
              <div>
                <h4 className="font-bold text-sm text-orange-600 dark:text-orange-400">
                  Low Confidence Match Detected
                </h4>
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Distance: {recognitionResult?.distance} (Confidence: {(pendingLowConfidenceUser.confidence * 100).toFixed(1)}%).
                  Confirm identity before logging attendance.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPendingLowConfidenceUser(null)}
                className="px-3 py-1.5 rounded text-xs border"
                style={{ borderColor: 'var(--line)', color: 'var(--text)' }}
              >
                Cancel
              </button>
              <button
                id="btn-confirm-low-confidence"
                onClick={() => handleMarkAttendance(pendingLowConfidenceUser.user, pendingLowConfidenceUser.confidence, false)}
                className="px-3 py-1.5 rounded text-xs font-bold bg-orange-500 text-white hover:bg-orange-600"
              >
                Confirm Match ({pendingLowConfidenceUser.user.full_name})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recognized User Card (If verified) */}
      {recognitionResult?.user && recognitionResult.status === 'recognized' && (
        <div className="p-4 rounded-xl border flex items-center justify-between" style={{ background: 'var(--panel)', borderColor: 'var(--line)' }}>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-lg overflow-hidden border relative" style={{ borderColor: 'var(--accent)' }}>
              <img
                src={recognitionResult.user.photo_url || ''}
                alt={recognitionResult.user.full_name}
                className="w-full h-full object-cover"
              />
              <div className="bracket b-tl !w-2 !h-2" />
              <div className="bracket b-br !w-2 !h-2" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base" style={{ color: 'var(--text)' }}>
                  {recognitionResult.user.full_name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded mono uppercase" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {recognitionResult.user.user_role}
                </span>
              </div>
              <p className="text-xs mono" style={{ color: 'var(--accent)' }}>
                {recognitionResult.user.roll_number || 'NO ROLL NUMBER'} &bull; {recognitionResult.user.department}
              </p>
              <p className="text-[11px] mono mt-0.5" style={{ color: 'var(--text-dim)' }}>
                Vector Distance: {recognitionResult.distance} &bull; Match Confidence: {(recognitionResult.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Verified & Checked In
            </span>
            <p className="text-[11px] mono mt-1" style={{ color: 'var(--text-dim)' }}>
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
