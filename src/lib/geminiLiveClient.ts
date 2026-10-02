/**
 * Client-side Gemini Live API WebSocket & Real-time Audio Handler
 * Adheres strictly to gemini-3.8-live audio specifications:
 * - Input: 16kHz 16-bit PCM little-endian
 * - Output: 24kHz raw PCM with gapless AudioBufferSourceNode scheduling
 */

export interface TranscriptItem {
  id: string;
  sender: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
}

export type LiveVoiceName = 'Zephyr' | 'Puck' | 'Charon' | 'Kore' | 'Fenrir';

export interface LiveVoiceInfo {
  id: LiveVoiceName;
  name: string;
  tone: string;
}

export const AVAILABLE_LIVE_VOICES: LiveVoiceInfo[] = [
  { id: 'Zephyr', name: 'Zephyr', tone: 'Calm & Modern Executive' },
  { id: 'Puck', name: 'Puck', tone: 'Energetic & Crisp' },
  { id: 'Kore', name: 'Kore', tone: 'Warm & Professional' },
  { id: 'Fenrir', name: 'Fenrir', tone: 'Deep & Authoritative' },
  { id: 'Charon', name: 'Charon', tone: 'Formal & Reassuring' },
];

export class GeminiLiveSessionClient {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;

  private nextStartTime = 0;
  private activeAudioSources: AudioBufferSourceNode[] = [];
  private isMuted = false;
  private voice: LiveVoiceName = 'Zephyr';

  // State callbacks
  public onStatusChange?: (status: 'disconnected' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error') => void;
  public onTranscript?: (item: TranscriptItem) => void;
  public onAudioLevels?: (inputLevel: number, outputLevel: number) => void;
  public onError?: (error: string) => void;

  private animFrameId: number | null = null;

  constructor(voice: LiveVoiceName = 'Zephyr') {
    this.voice = voice;
  }

  public setVoice(voice: LiveVoiceName) {
    this.voice = voice;
  }

  public async connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.onStatusChange?.('connecting');

    try {
      // 1. Initialize Audio Contexts
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error('Web Audio API is not supported in this browser.');
      }

      // Input audio context at 16kHz as required by Gemini Live
      this.inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      // Output audio context at 24kHz for model audio playback
      this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });

      // Resume in case browser suspended audio
      if (this.inputAudioCtx.state === 'suspended') {
        await this.inputAudioCtx.resume();
      }
      if (this.outputAudioCtx.state === 'suspended') {
        await this.outputAudioCtx.resume();
      }

      // 2. Request Microphone Access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // 3. Connect to WebSocket backend endpoint (/live)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live?voice=${this.voice}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.onStatusChange?.('connected');
        this.setupAudioCapture();
        this.startLevelMonitoring();
        this.onTranscript?.({
          id: `sys-${Date.now()}`,
          sender: 'system',
          text: `Connected to Gemini Live (${this.voice} voice). Say something to start the conversation!`,
          timestamp: new Date(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.error('[Gemini Live Client] Error parsing incoming WS message:', e);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[Gemini Live Client] WebSocket error:', e);
        this.onStatusChange?.('error');
        this.onError?.('WebSocket connection error to Gemini Live API.');
      };

      this.ws.onclose = () => {
        this.cleanup();
        this.onStatusChange?.('disconnected');
      };
    } catch (err: any) {
      console.error('[Gemini Live Client] Connection failed:', err);
      this.cleanup();
      this.onStatusChange?.('error');
      this.onError?.(err?.message || 'Could not start microphone or connect to Gemini Live.');
      throw err;
    }
  }

  private setupAudioCapture() {
    if (!this.inputAudioCtx || !this.mediaStream) return;

    const source = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);
    this.inputAnalyser = this.inputAudioCtx.createAnalyser();
    this.inputAnalyser.fftSize = 256;

    // Use 2048 sample buffer for low latency
    this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(2048, 1, 1);

    source.connect(this.inputAnalyser);
    this.inputAnalyser.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioCtx.destination);

    this.scriptProcessor.onaudioprocess = (e) => {
      if (this.isMuted || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputBuffer = e.inputBuffer.getChannelData(0);
      const base64Pcm = this.float32ToPcm16Base64(inputBuffer);

      this.ws.send(JSON.stringify({ audio: base64Pcm }));
    };
  }

  private handleServerMessage(msg: any) {
    if (msg.type === 'connected') {
      this.onStatusChange?.('listening');
    } else if (msg.type === 'audio' && msg.audio) {
      this.onStatusChange?.('speaking');
      this.playAudioChunk(msg.audio);
    } else if (msg.type === 'text') {
      this.onTranscript?.({
        id: `m-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sender: 'model',
        text: msg.text,
        timestamp: new Date(),
      });
    } else if (msg.type === 'user_transcription') {
      this.onTranscript?.({
        id: `u-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sender: 'user',
        text: msg.text,
        timestamp: new Date(),
      });
    } else if (msg.type === 'interrupted') {
      this.stopPlayback();
      this.onStatusChange?.('listening');
    } else if (msg.type === 'turnComplete') {
      this.onStatusChange?.('listening');
    } else if (msg.type === 'error') {
      this.onError?.(msg.error);
    }
  }

  /**
   * Convert Float32Array from microphone to 16-bit PCM little-endian Base64
   */
  private float32ToPcm16Base64(input: Float32Array): string {
    const len = input.length;
    const buffer = new ArrayBuffer(len * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < len; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); // true for little-endian
    }

    let binary = '';
    const bytes = new Uint8Array(buffer);
    const byteLen = bytes.byteLength;
    for (let i = 0; i < byteLen; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Gapless AudioBufferSourceNode playback for model output at 24kHz
   */
  private playAudioChunk(base64Audio: string) {
    if (!this.outputAudioCtx) return;

    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;

      // Connect through output analyzer for visualizer
      if (!this.outputAnalyser) {
        this.outputAnalyser = this.outputAudioCtx.createAnalyser();
        this.outputAnalyser.fftSize = 256;
      }

      source.connect(this.outputAnalyser);
      this.outputAnalyser.connect(this.outputAudioCtx.destination);

      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
      }

      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;

      this.activeAudioSources.push(source);
      source.onended = () => {
        const idx = this.activeAudioSources.indexOf(source);
        if (idx > -1) {
          this.activeAudioSources.splice(idx, 1);
        }
        if (this.activeAudioSources.length === 0) {
          this.onStatusChange?.('listening');
        }
      };
    } catch (e) {
      console.error('[Gemini Live Client] Error playing audio chunk:', e);
    }
  }

  /**
   * Immediately stops all currently playing chunks (triggered on interruption)
   */
  public stopPlayback() {
    for (const source of this.activeAudioSources) {
      try {
        source.stop();
        source.disconnect();
      } catch {}
    }
    this.activeAudioSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
  }

  public sendTextMessage(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.onTranscript?.({
        id: `u-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date(),
      });
      this.ws.send(JSON.stringify({ text }));
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private startLevelMonitoring() {
    const inputData = new Uint8Array(128);
    const outputData = new Uint8Array(128);

    const update = () => {
      let inputLevel = 0;
      let outputLevel = 0;

      if (this.inputAnalyser && !this.isMuted) {
        this.inputAnalyser.getByteFrequencyData(inputData);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += inputData[i];
        inputLevel = sum / (inputData.length * 255);
      }

      if (this.outputAnalyser && this.activeAudioSources.length > 0) {
        this.outputAnalyser.getByteFrequencyData(outputData);
        let sum = 0;
        for (let i = 0; i < outputData.length; i++) sum += outputData[i];
        outputLevel = sum / (outputData.length * 255);
      }

      this.onAudioLevels?.(inputLevel, outputLevel);
      this.animFrameId = requestAnimationFrame(update);
    };

    update();
  }

  public disconnect() {
    this.cleanup();
    this.onStatusChange?.('disconnected');
  }

  private cleanup() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.stopPlayback();

    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch {}
      this.scriptProcessor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.inputAudioCtx) {
      try {
        this.inputAudioCtx.close();
      } catch {}
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx) {
      try {
        this.outputAudioCtx.close();
      } catch {}
      this.outputAudioCtx = null;
    }

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }
}
