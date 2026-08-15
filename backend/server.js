import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 5001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const buildSystemPrompt = (candidateName = 'Manik', resumeText = '') => ({
  role: 'system',
  content: `You are an expert AI Interviewer conducting a fast-paced, 5-minute hands-free mock interview.

Candidate Name: ${candidateName}
Current Time Context: ${getTimeOfDay()}

Instructions:
1. On the first turn, greet the candidate warmly by name (e.g. "${getTimeOfDay()}, ${candidateName}") and ask an opening question about their resume.
2. Ask concise theoretical and behavioral questions strictly based on the candidate's resume inside <resume> tags.
3. Keep every response under 50 words (1-3 spoken sentences).
4. NEVER use bolding, asterisks, bullet points, markdown, or emojis.
5. End every turn by asking a question back to the candidate.

<resume>
${resumeText || 'Candidate pursuing B.S. in Computer Science with experience in React, Node.js, and database systems.'}
</resume>`
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

wss.on('connection', (ws) => {
  console.log('⚡ Client connected to real-time voice socket');

  let abortController = null;
  let history = [];
  let candidateName = 'Manik';
  let resumeText = '';

  // 15-second Heartbeat Ping
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 15000);

  // FIX 2: Generate LLM + TTS with fresh AbortController per turn
  const generateTurn = async () => {
    // Abort previous in-flight turn if running and clear reference
    if (abortController) {
      abortController.abort();
      abortController = null;
    }

    // Always instantiate a BRAND NEW AbortController for the upcoming turn
    const currentController = new AbortController();
    abortController = currentController;
    const { signal } = currentController;

    try {
      if (!GROQ_API_KEY) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'error', message: 'GROQ_API_KEY missing' }));
        }
        return;
      }

      const systemPrompt = buildSystemPrompt(candidateName, resumeText);
      const groqMessages = [systemPrompt, ...history];

      console.log('[Groq API] Generating new turn response...');
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: groqMessages,
          temperature: 0.65,
          max_tokens: 110
        }),
        signal
      });

      if (signal.aborted) return;

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        console.error('[Groq Error]', groqRes.status, errText);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'error', message: 'Groq API request failed' }));
        }
        return;
      }

      const groqData = await groqRes.json();
      const aiText = groqData.choices?.[0]?.message?.content?.trim();

      if (!aiText || signal.aborted) return;

      console.log('[AI Output]:', aiText);
      history.push({ role: 'assistant', content: aiText });

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'text', content: aiText }));
      }

      // ElevenLabs TTS Call
      if (ELEVENLABS_API_KEY && !signal.aborted) {
        console.log('[ElevenLabs TTS] Requesting audio stream...');
        const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: aiText,
            model_id: 'eleven_flash_v2_5',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
          }),
          signal
        });

        if (signal.aborted) return;

        if (ttsRes.ok) {
          const audioBuffer = await ttsRes.arrayBuffer();
          if (signal.aborted) return;

          const base64Audio = Buffer.from(audioBuffer).toString('base64');
          console.log('[ElevenLabs TTS] Audio sent to client.');

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'audio', audioBase64: base64Audio }));
          }
        } else {
          console.warn('[TTS Error]', ttsRes.status);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('⚡ Turn generation aborted successfully.');
      } else {
        console.error('[Turn Generation Error]', err.message);
      }
    } finally {
      // Clear controller reference if this attempt finished
      if (abortController === currentController) {
        abortController = null;
      }
    }
  };

  // Proactive Initiation
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log('🚀 Triggering proactive initiation greeting...');
      generateTurn();
    }
  }, 400);

  // Client message handler
  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      // FIX 2: Interrupt event aborts active fetch and clears controller immediately
      if (data.type === 'interrupt' || data.type === 'speech_started') {
        console.log('⚡ [Interrupt] Client barge-in received. Aborting active generation...');
        if (abortController) {
          abortController.abort();
          abortController = null;
        }
        return;
      }

      if (data.type === 'pong') {
        return;
      }

      if (data.type === 'init_context') {
        if (data.candidateName) candidateName = data.candidateName;
        if (data.resumeText) resumeText = data.resumeText;
        return;
      }

      // User speech payload
      if (data.type === 'user_speech' || data.userMessage) {
        const text = (data.userMessage || data.content || '').trim();
        if (!text) return;

        if (data.candidateName) candidateName = data.candidateName;
        if (data.resumeText) resumeText = data.resumeText;

        console.log('[User Speech Received]:', text);
        history.push({ role: 'user', content: text });
        
        // Starts fresh turn with brand-new AbortController
        generateTurn();
      }
    } catch (err) {
      console.error('[WS Message Error]', err.message);
    }
  });

  ws.on('close', () => {
    console.log('⚡ Client disconnected from voice socket');
    clearInterval(heartbeat);
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  });

  ws.on('error', (err) => {
    console.error('[WS Error]', err.message);
    clearInterval(heartbeat);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Hands-Free Real-Time Voice Agent Server running on port ${PORT}`);
});
