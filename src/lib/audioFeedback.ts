/**
 * Web Audio API Biometric Sound Synthesizer
 * Provides futuristic scanner chimes, sonar pings, success tones, warning alerts, and mechanical lock audio.
 */

class BiometricAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Unlock AudioContext on user interaction (e.g. click "Start Camera")
   */
  public unlockAudio() {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Subtle High-Tech Sonar Ping (Face Detected / Target Acquired in Viewfinder)
   * Creates a crystalline sonar blip with smooth pitch sweep and faint reverberant acoustic echo.
   */
  public playSonarPing() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Master output attenuator so ping is gentle, futuristic, and unobtrusive
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.08, now);
      master.connect(ctx.destination);

      // Primary Sonar Wave: Clean sine sweep 1380 Hz -> 1220 Hz
      const oscPrimary = ctx.createOscillator();
      const gainPrimary = ctx.createGain();
      oscPrimary.type = 'sine';
      oscPrimary.frequency.setValueAtTime(1380, now);
      oscPrimary.frequency.exponentialRampToValueAtTime(1220, now + 0.16);

      gainPrimary.gain.setValueAtTime(0.001, now);
      gainPrimary.gain.linearRampToValueAtTime(0.85, now + 0.006);
      gainPrimary.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      oscPrimary.connect(gainPrimary);
      gainPrimary.connect(master);
      oscPrimary.start(now);
      oscPrimary.stop(now + 0.18);

      // Glassy High Harmonic overtone: 2760 Hz -> 2440 Hz
      const oscHarmonic = ctx.createOscillator();
      const gainHarmonic = ctx.createGain();
      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(2760, now);
      oscHarmonic.frequency.exponentialRampToValueAtTime(2440, now + 0.08);

      gainHarmonic.gain.setValueAtTime(0.001, now);
      gainHarmonic.gain.linearRampToValueAtTime(0.22, now + 0.004);
      gainHarmonic.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      oscHarmonic.connect(gainHarmonic);
      gainHarmonic.connect(master);
      oscHarmonic.start(now);
      oscHarmonic.stop(now + 0.09);

      // Faint Submarine Sonar Echo Tap (delayed reflection tap)
      const echoDelay = 0.07;
      const oscEcho = ctx.createOscillator();
      const gainEcho = ctx.createGain();
      oscEcho.type = 'sine';
      oscEcho.frequency.setValueAtTime(1220, now + echoDelay);

      gainEcho.gain.setValueAtTime(0.001, now + echoDelay);
      gainEcho.gain.linearRampToValueAtTime(0.25, now + echoDelay + 0.005);
      gainEcho.gain.exponentialRampToValueAtTime(0.001, now + echoDelay + 0.15);

      oscEcho.connect(gainEcho);
      gainEcho.connect(master);
      oscEcho.start(now + echoDelay);
      oscEcho.stop(now + echoDelay + 0.15);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Positive Biometric Attendance Confirmation Chime (Tri-tone ascending harmonic)
   * Triggers when attendance is successfully logged in the system.
   */
  public playAttendanceSuccess() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.11, now);
      master.connect(ctx.destination);

      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.7, now + 0.006);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc1.connect(gain1);
      gain1.connect(master);
      osc1.start(now);
      osc1.stop(now + 0.14);

      // Tone 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.07);
      gain2.gain.setValueAtTime(0.001, now + 0.07);
      gain2.gain.linearRampToValueAtTime(0.85, now + 0.075);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(master);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.22);

      // Tone 3: 1174.66 Hz (D6) - Resonant affirmative bell
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1174.66, now + 0.14);
      gain3.gain.setValueAtTime(0.001, now + 0.14);
      gain3.gain.linearRampToValueAtTime(1.0, now + 0.146);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc3.connect(gain3);
      gain3.connect(master);
      osc3.start(now + 0.14);
      osc3.stop(now + 0.42);

      // Subtle chime overtone (2349.32 Hz)
      const oscShimmer = ctx.createOscillator();
      const gainShimmer = ctx.createGain();
      oscShimmer.type = 'triangle';
      oscShimmer.frequency.setValueAtTime(2349.32, now + 0.15);
      gainShimmer.gain.setValueAtTime(0.001, now + 0.15);
      gainShimmer.gain.linearRampToValueAtTime(0.18, now + 0.16);
      gainShimmer.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      oscShimmer.connect(gainShimmer);
      gainShimmer.connect(master);
      oscShimmer.start(now + 0.15);
      oscShimmer.stop(now + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  /**
   * Alias for backward compatibility
   */
  public playSuccess() {
    this.playAttendanceSuccess();
  }

  /**
   * Security Warning Alert (Locked profile / Identity mismatch)
   */
  public playAlert() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.25);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {}
  }

  /**
   * Mechanical Profile Lock / Unlock Click
   */
  public playLockSound(isLocking = true) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isLocking ? 480 : 380, now);
      osc.frequency.exponentialRampToValueAtTime(isLocking ? 240 : 580, now + 0.12);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }
}

export const biometricAudio = new BiometricAudioSynthesizer();
