import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize GoogleGenAI client (Server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// REST Health and Info Endpoints
app.get('/api/voice-assistant/status', (_req, res) => {
  res.json({
    status: 'online',
    model: 'gemini-3.8-live',
    capabilities: ['realtime_audio', 'bidirectional_streaming', 'transcription'],
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Download Complete Project Documentation (PDF)
app.get(['/api/documentation-pdf', '/api/download-documentation-pdf', '/download-docs'], (_req, res) => {
  const pdfPath = path.resolve(__dirname, 'public/BioScan_AI_Project_Documentation.pdf');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="BioScan_AI_Project_Documentation.pdf"');
  res.sendFile(pdfPath);
});

// Optional Fallback Text Query Endpoint (using gemini-3.8-flash)
app.post('/api/voice-assistant/chat', async (req, res) => {
  try {
    const { prompt, systemContext } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt in request body' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: systemContext || 'You are the intelligent voice assistant for BioScan.AI biometric attendance terminal.',
      },
    });

    return res.json({ text: response.text });
  } catch (err: any) {
    console.error('Error generating chat content:', err);
    return res.status(500).json({ error: err?.message || 'Failed to process request' });
  }
});

// WebSocket Server for Gemini Live API (gemini-3.8-live)
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
  if (url.pathname === '/live' || url.pathname === '/api/live' || url.pathname === '/api/live-ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', async (clientWs: WebSocket, request: http.IncomingMessage) => {
  const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
  const requestedVoice = url.searchParams.get('voice') || 'Zephyr';
  const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
  const voiceName = validVoices.includes(requestedVoice) ? requestedVoice : 'Zephyr';

  console.log(`[Gemini Live] Client connected with voice: ${voiceName}`);

  if (!process.env.GEMINI_API_KEY) {
    clientWs.send(JSON.stringify({
      type: 'error',
      error: 'GEMINI_API_KEY environment variable is not configured on the server.',
    }));
    return;
  }

  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
        systemInstruction: `You are the voice assistant for BioScan.AI, a high-tech biometric face recognition attendance terminal.
You have real-time audio voice conversations with employees, security managers, and kiosk users.
Keep answers concise, direct, helpful, and natural (1 to 3 spoken sentences per turn).
You can guide users on:
1. Face scan positioning (stay inside reticle frame, steady lighting).
2. Biometric attendance logging and Euclidean distance threshold (<=0.48).
3. Attendance stats, punch in/out modes, duplicate detection prevention.
4. User enrollment and role permissions.
Greet the user cordially and assist them swiftly.`,
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          console.log('[Gemini Live] Live session opened successfully with gemini-3.8-live');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'connected',
              model: 'gemini-3.8-live',
              voice: voiceName,
            }));
          }
        },
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // Extract and stream audio chunk
          const parts = message.serverContent?.modelTurn?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              clientWs.send(JSON.stringify({
                type: 'audio',
                audio: part.inlineData.data,
              }));
            }
            if (part.text) {
              clientWs.send(JSON.stringify({
                type: 'text',
                text: part.text,
                sender: 'model',
              }));
            }
          }

          // Output audio transcription
          if (message.serverContent?.outputTranscription?.text) {
            clientWs.send(JSON.stringify({
              type: 'text',
              text: message.serverContent.outputTranscription.text,
              sender: 'model',
            }));
          }

          // User input speech transcription
          if (message.serverContent?.inputTranscription?.text) {
            clientWs.send(JSON.stringify({
              type: 'user_transcription',
              text: message.serverContent.inputTranscription.text,
            }));
          }

          // Model interrupted by user speech
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted' }));
          }

          // Turn finished
          if (message.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ type: 'turnComplete' }));
          }
        },
        onerror: (err: any) => {
          console.error('[Gemini Live] Session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'error',
              error: err?.message || 'Error occurred in Gemini Live session',
            }));
          }
        },
        onclose: () => {
          console.log('[Gemini Live] Live session closed');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'closed' }));
          }
        },
      },
    });

    // Handle messages coming from the client browser
    clientWs.on('message', (raw) => {
      try {
        const payload = JSON.parse(raw.toString());

        // 1. Audio stream from microphone (16kHz 16-bit PCM little-endian base64)
        if (payload.audio && session) {
          session.sendRealtimeInput({
            audio: {
              data: payload.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        }

        // 2. Realtime text input
        if (payload.text && session) {
          session.sendRealtimeInput({
            text: payload.text,
          });
        }
      } catch (e) {
        console.error('[Gemini Live] Error parsing client message:', e);
      }
    });

    clientWs.on('close', () => {
      console.log('[Gemini Live] Client WebSocket closed, closing Gemini session');
      try {
        session?.close?.();
      } catch {}
    });
  } catch (err: any) {
    console.error('[Gemini Live] Failed to connect to Gemini Live API:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'error',
        error: err?.message || 'Failed to initialize Gemini Live session',
      }));
    }
  }
});

// Mount Vite or serve static production build
async function setupApp() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with Gemini Live API (gemini-3.8-live) enabled`);
  });
}

setupApp().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
