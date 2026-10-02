import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  X,
  Sparkles,
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  GeminiLiveSessionClient,
  TranscriptItem,
  LiveVoiceName,
  AVAILABLE_LIVE_VOICES,
} from '../lib/geminiLiveClient';

interface VoiceConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemContextInfo?: string;
}

export const VoiceConversationModal: React.FC<VoiceConversationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [status, setStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error'
  >('disconnected');
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<LiveVoiceName>('Zephyr');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);

  const clientRef = useRef<GeminiLiveSessionClient | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen && clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
      setStatus('disconnected');
    }
  }, [isOpen]);

  const handleStartConversation = async () => {
    setErrorMessage(null);

    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }

    const client = new GeminiLiveSessionClient(selectedVoice);
    clientRef.current = client;

    client.onStatusChange = (newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'connected' || newStatus === 'listening') {
        setErrorMessage(null);
      }
    };

    client.onTranscript = (item) => {
      setTranscripts((prev) => [...prev, item]);
    };

    client.onAudioLevels = (inLevel, outLevel) => {
      setInputLevel(inLevel);
      setOutputLevel(outLevel);
    };

    client.onError = (err) => {
      setErrorMessage(err);
    };

    try {
      await client.connect();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to start Live session');
    }
  };

  const handleStopConversation = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setStatus('disconnected');
    setInputLevel(0);
    setOutputLevel(0);
  };

  const handleToggleMute = () => {
    if (!clientRef.current) return;
    const nextMuted = !isMuted;
    clientRef.current.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  const handleVoiceChange = (voice: LiveVoiceName) => {
    setSelectedVoice(voice);
    if (clientRef.current) {
      clientRef.current.setVoice(voice);
      // Restart to apply new voice configuration
      if (status !== 'disconnected') {
        handleStopConversation();
        setTimeout(() => {
          handleStartConversation();
        }, 200);
      }
    }
  };

  const handleSendTextMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || !clientRef.current) return;

    clientRef.current.sendTextMessage(textInput.trim());
    setTextInput('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (clientRef.current && (status === 'listening' || status === 'speaking' || status === 'connected')) {
      clientRef.current.sendTextMessage(prompt);
    } else {
      setTextInput(prompt);
    }
  };

  if (!isOpen) return null;

  const isLive = status === 'listening' || status === 'speaking' || status === 'connected';

  // Compute reactive visualizer scales
  const activeLevel = status === 'speaking' ? outputLevel : inputLevel;
  const pulseScale = 1 + Math.min(0.45, activeLevel * 2.2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col my-auto transition-all"
        style={{
          background: 'var(--panel)',
          borderColor: isLive ? 'var(--accent-line)' : 'var(--line)',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          className="p-4 sm:p-5 border-b flex items-center justify-between gap-3"
          style={{ borderColor: 'var(--line)', background: 'var(--bg)' }}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border relative transition-all ${
                isLive ? 'border-cyan-400 shadow-lg shadow-cyan-500/20' : ''
              }`}
              style={{
                borderColor: isLive ? 'var(--accent)' : 'var(--line)',
                background: isLive ? 'var(--accent-soft)' : 'var(--panel)',
              }}
            >
              <Radio
                className={`w-5 h-5 ${isLive ? 'animate-pulse text-cyan-400' : 'text-slate-400'}`}
                style={{ color: isLive ? 'var(--accent)' : undefined }}
              />
              {isLive && (
                <span
                  className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping"
                  style={{ background: 'var(--accent)' }}
                />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Gemini Live Voice Conversation
                </h2>
                <span
                  className="px-2 py-0.5 rounded text-[10px] mono font-bold border tracking-wider uppercase"
                  style={{
                    borderColor: 'var(--accent-line)',
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Real-time low-latency bidirectional voice dialogue with 24kHz audio playback
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl border hover:opacity-80 transition-opacity"
              style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}
              title="Close Voice Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voice Selector & Live Status Pill */}
        <div
          className="px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs"
          style={{ borderColor: 'var(--line)', background: 'var(--panel-solid, var(--bg))' }}
        >
          <div className="flex items-center space-x-2">
            <span className="font-semibold" style={{ color: 'var(--text-dim)' }}>
              AI Persona Voice:
            </span>
            <div className="flex items-center space-x-1 bg-black/20 p-1 rounded-lg border border-white/5">
              {AVAILABLE_LIVE_VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleVoiceChange(v.id)}
                  disabled={status === 'connecting'}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    selectedVoice === v.id
                      ? 'shadow-sm text-black font-bold'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    background: selectedVoice === v.id ? 'var(--accent)' : 'transparent',
                    color: selectedVoice === v.id ? '#090608' : 'var(--text)',
                  }}
                  title={v.tone}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center space-x-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status === 'speaking'
                  ? 'bg-emerald-400 animate-bounce'
                  : status === 'listening'
                  ? 'bg-cyan-400 animate-pulse'
                  : status === 'connecting'
                  ? 'bg-amber-400 animate-ping'
                  : status === 'error'
                  ? 'bg-red-500'
                  : 'bg-slate-500'
              }`}
            />
            <span className="mono uppercase tracking-wider font-semibold text-[11px]">
              {status === 'speaking' && 'Gemini Speaking (24kHz)'}
              {status === 'listening' && 'Listening (16kHz PCM)'}
              {status === 'connecting' && 'Connecting to Live API...'}
              {status === 'connected' && 'Ready / Standby'}
              {status === 'disconnected' && 'Session Offline'}
              {status === 'error' && 'Connection Error'}
            </span>
          </div>
        </div>

        {/* Main Interactive Stage */}
        <div className="p-5 flex flex-col items-center justify-center border-b relative overflow-hidden" style={{ borderColor: 'var(--line)' }}>
          {/* Animated Background Sonar Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div
              className="w-52 h-52 rounded-full border border-dashed transition-transform duration-100"
              style={{
                borderColor: status === 'speaking' ? '#10b981' : 'var(--accent)',
                transform: `scale(${pulseScale * 1.1})`,
              }}
            />
            <div
              className="w-72 h-72 rounded-full border border-dotted opacity-50 transition-transform duration-100"
              style={{
                borderColor: status === 'speaking' ? '#10b981' : 'var(--accent)',
                transform: `scale(${pulseScale * 1.25})`,
              }}
            />
          </div>

          {/* Central Pulsing Audio Orb */}
          <div className="relative z-10 flex flex-col items-center my-3">
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center relative shadow-2xl transition-all duration-100"
              style={{
                background:
                  status === 'speaking'
                    ? 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, rgba(16, 185, 129, 0.08) 75%)'
                    : status === 'listening'
                    ? 'radial-gradient(circle, var(--accent-soft) 0%, rgba(0,0,0,0) 75%)'
                    : 'rgba(255,255,255,0.03)',
                transform: `scale(${pulseScale})`,
                boxShadow:
                  status === 'speaking'
                    ? '0 0 40px rgba(16, 185, 129, 0.35)'
                    : status === 'listening'
                    ? '0 0 35px var(--glow)'
                    : 'none',
                border: `2px solid ${
                  status === 'speaking'
                    ? '#10b981'
                    : status === 'listening'
                    ? 'var(--accent)'
                    : 'var(--line)'
                }`,
              }}
            >
              {status === 'speaking' ? (
                <Volume2 className="w-12 h-12 text-emerald-400 animate-pulse" />
              ) : isMuted ? (
                <MicOff className="w-12 h-12 text-red-400" />
              ) : (
                <Mic
                  className={`w-12 h-12 ${
                    status === 'listening' ? 'text-cyan-400 animate-pulse' : 'text-slate-500'
                  }`}
                  style={{ color: status === 'listening' ? 'var(--accent)' : undefined }}
                />
              )}

              {/* Dynamic waveform ring dots */}
              {isLive && (
                <div
                  className="absolute inset-1 rounded-full border-2 border-dashed pointer-events-none animate-spin"
                  style={{
                    borderColor: status === 'speaking' ? 'rgba(16, 185, 129, 0.6)' : 'var(--accent-line)',
                    animationDuration: '14s',
                  }}
                />
              )}
            </div>

            {/* Sub-label */}
            <div className="mt-4 text-center">
              <h3 className="text-sm font-bold tracking-tight">
                {status === 'speaking' && 'Gemini is speaking... (Interrupt anytime)'}
                {status === 'listening' && (isMuted ? 'Microphone Muted' : 'Listening... Speak naturally')}
                {status === 'connecting' && 'Opening real-time WebSocket connection...'}
                {status === 'disconnected' && 'Click below to start live voice dialogue'}
                {status === 'error' && 'Connection interrupted'}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                Powered by Gemini Live API with automatic user turn interruption
              </p>
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2 z-10">
            {!isLive ? (
              <button
                onClick={handleStartConversation}
                disabled={status === 'connecting'}
                className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-all shadow-lg hover:scale-105 active:scale-95"
                style={{
                  background: 'var(--accent)',
                  color: '#090608',
                }}
              >
                <Mic className="w-4 h-4" />
                <span>{status === 'connecting' ? 'Connecting...' : 'Start Voice Conversation'}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleToggleMute}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all ${
                    isMuted ? 'bg-red-500/20 border-red-500 text-red-300' : 'hover:opacity-80'
                  }`}
                  style={{
                    borderColor: isMuted ? '#ef4444' : 'var(--line)',
                    background: isMuted ? 'rgba(239,68,68,0.15)' : 'var(--bg)',
                  }}
                >
                  {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-cyan-400" />}
                  <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                </button>

                <button
                  onClick={handleStopConversation}
                  className="px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 bg-red-600 hover:bg-red-500 text-white shadow-md transition-all active:scale-95"
                >
                  <X className="w-4 h-4" />
                  <span>End Live Session</span>
                </button>
              </>
            )}

            {transcripts.length > 0 && (
              <button
                onClick={() => setTranscripts([])}
                className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border hover:opacity-80 transition-opacity"
                style={{ borderColor: 'var(--line)', color: 'var(--text-dim)' }}
                title="Clear transcript history"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-3 p-2.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-xs flex items-center space-x-2 max-w-md">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Live Transcript Stream */}
        <div className="flex-1 p-4 overflow-y-auto min-h-[170px] max-h-[260px] space-y-2.5" style={{ background: 'var(--bg)' }}>
          <div className="text-[11px] mono uppercase font-bold tracking-wider flex items-center space-x-1.5" style={{ color: 'var(--text-dim)' }}>
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Live Real-Time Transcript &amp; Dialogue</span>
          </div>

          {transcripts.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                No spoken turns yet. Say hello or tap one of the suggested topics below:
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                {[
                  'What is today\'s attendance summary?',
                  'How does the 128-d face embedding work?',
                  'How do I register a new employee?',
                  'Explain duplicate check-in prevention',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="px-2.5 py-1 rounded-lg border text-[11px] transition-all hover:border-cyan-400 hover:text-cyan-300 text-left"
                    style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
                  >
                    &ldquo;{prompt}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            transcripts.map((item) => (
              <div
                key={item.id}
                className={`flex flex-col ${
                  item.sender === 'user'
                    ? 'items-end'
                    : item.sender === 'system'
                    ? 'items-center'
                    : 'items-start'
                }`}
              >
                {item.sender === 'system' ? (
                  <div
                    className="px-3 py-1 rounded-full text-[11px] mono border text-center max-w-md my-1"
                    style={{
                      borderColor: 'var(--line)',
                      background: 'var(--panel)',
                      color: 'var(--text-dim)',
                    }}
                  >
                    {item.text}
                  </div>
                ) : (
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                      item.sender === 'user'
                        ? 'rounded-br-sm'
                        : 'rounded-bl-sm border'
                    }`}
                    style={{
                      background:
                        item.sender === 'user' ? 'var(--accent)' : 'var(--panel)',
                      color: item.sender === 'user' ? '#090608' : 'var(--text)',
                      borderColor: item.sender === 'user' ? 'transparent' : 'var(--line)',
                    }}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 opacity-70 text-[9px] mono uppercase font-bold">
                      <span>{item.sender === 'user' ? 'You (Spoken)' : `Gemini Live (${selectedVoice})`}</span>
                      <span>&bull;</span>
                      <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{item.text}</p>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Text Input Companion Bar (Supports typing while speaking) */}
        <div
          className="p-3 border-t flex items-center space-x-2"
          style={{ borderColor: 'var(--line)', background: 'var(--panel)' }}
        >
          <form onSubmit={handleSendTextMessage} className="flex-1 flex items-center space-x-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isLive ? 'Type a question or message to Gemini Live...' : 'Connect above to start voice conversation...'}
              disabled={!isLive}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border focus:outline-none disabled:opacity-50"
              style={{
                background: 'var(--bg)',
                borderColor: 'var(--line)',
                color: 'var(--text)',
              }}
            />
            <button
              type="submit"
              disabled={!isLive || !textInput.trim()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all disabled:opacity-40"
              style={{
                background: 'var(--accent)',
                color: '#090608',
              }}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Footer Technical Metadata */}
        <div
          className="px-4 py-2 border-t flex flex-wrap items-center justify-between text-[10px] mono"
          style={{
            borderColor: 'var(--line)',
            background: 'var(--panel-solid, var(--bg))',
            color: 'var(--text-dim)',
          }}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Direct WebSocket Bridge: 16kHz PCM In &bull; 24kHz PCM Out</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Model: gemini-3.8-live</span>
            <span>&bull;</span>
            <span className="flex items-center space-x-1">
              <HelpCircle className="w-2.5 h-2.5" />
              <span>Zero-latency interruptions</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
