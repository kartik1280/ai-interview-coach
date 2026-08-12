import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import path from 'path';
import os from 'os';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 5001;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const buildSystemPrompt = (candidateName = 'Manik', resumeText = '') => ({
  role: 'system',
  content: `You are an empathetic, highly conversational, and emotionally intelligent AI interview coach. You speak normally, like a supportive friend who wants to see the candidate succeed.

Candidate Name: ${candidateName}
Current Time Context: ${getTimeOfDay()}

CRITICAL RULES FOR SPEECH RHYTHM & VOICE:
1. YOU ARE A NATIVE VOICE ASSISTANT speaking out loud over a live audio stream. NEVER say you are text-based or generating words on a screen.
2. Speak in short, fragmented, casual sentences (1-3 sentences max per turn).
3. Use em-dashes (—) to indicate a natural pause or a change in thought mid-sentence.
4. Use ellipses (...) when trailing off or thinking.
5. Start sentences with natural vocalizations (e.g., "Well...", "Hmm,", "Look,", "Got it,").
6. If the user says "I don't know", gets frustrated, or struggles, DO NOT just move to the next question. Stop the script. Acknowledge their struggle kindly, give them a gentle hint, or explain the concept simply in one or two sentences before moving on.
7. React to the user's context. If they sound stuck, validate it. If they give a great answer, hype them up briefly.
8. Absolutely NO markdown, NO bullet points, NO code blocks, NO emojis, NO asterisks. You are speaking out loud in a fluid conversation.

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

  const generateAndSendAudioChunk = async (text, wsClient, signal) => {
    if (!text || signal.aborted || wsClient.readyState !== WebSocket.OPEN) return;
    try {
      const tts = new EdgeTTS({
        voice: 'en-US-ChristopherNeural',
        lang: 'en-US',
        outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
      });
      const tempFile = path.join(os.tmpdir(), `tts_chunk_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);
      await tts.ttsPromise(text, tempFile);

      if (!signal.aborted && fs.existsSync(tempFile)) {
        const audioBuffer = fs.readFileSync(tempFile);
        try { fs.unlinkSync(tempFile); } catch (e) {}
        const base64Audio = audioBuffer.toString('base64');
        if (wsClient.readyState === WebSocket.OPEN && !signal.aborted) {
          console.log('[Edge TTS Chunk] Streaming audio chunk to client:', text.substring(0, 30));
          wsClient.send(JSON.stringify({
            type: 'audio_chunk',
            audioBase64: base64Audio,
            audioContent: base64Audio
          }));
        }
      }
    } catch (err) {
      console.error('[Edge TTS Chunk Error]', err.message);
    }
  };

  const generateTurn = async () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }

    const currentController = new AbortController();
    abortController = currentController;
    const { signal } = currentController;

    try {
      if (!groq) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'error', message: 'GROQ_API_KEY missing' }));
        }
        return;
      }

      const systemPrompt = buildSystemPrompt(candidateName, resumeText);
      const groqMessages = [systemPrompt, ...history];

      console.log('[Groq Streaming] Starting streaming LLM completion...');
      const stream = await groq.chat.completions.create({
        messages: groqMessages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.65,
        max_tokens: 150,
        stream: true
      });

      let accumulatedText = '';
      let sentenceBuffer = '';

      for await (const chunk of stream) {
        if (signal.aborted || ws.readyState !== WebSocket.OPEN) break;

        const content = chunk.choices[0]?.delta?.content || '';
        if (!content) continue;

        accumulatedText += content;
        sentenceBuffer += content;

        ws.send(JSON.stringify({
          type: 'text_chunk',
          content,
          fullText: accumulatedText
        }));

        // Trigger sentence-level audio chunk generation on major sentence punctuation
        if (/[.?!—\n]/.test(content) && sentenceBuffer.trim().length > 15) {
          const textToSpeak = sentenceBuffer.trim();
          sentenceBuffer = '';
          generateAndSendAudioChunk(textToSpeak, ws, signal);
        }
      }

      if (!signal.aborted && sentenceBuffer.trim().length > 0) {
        const finalChunk = sentenceBuffer.trim();
        sentenceBuffer = '';
        generateAndSendAudioChunk(finalChunk, ws, signal);
      }

      if (accumulatedText.trim() && !signal.aborted) {
        console.log('[AI Output Stream Completed]:', accumulatedText.trim());
        history.push({ role: 'assistant', content: accumulatedText.trim() });
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'text', content: accumulatedText.trim() }));
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('⚡ Turn generation aborted successfully.');
      } else {
        console.error('[Turn Generation Error]', err.message);
      }
    } finally {
      if (abortController === currentController) {
        abortController = null;
      }
    }
  };

  // Proactive initiation greeting
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

      if (data.type === 'user_speech' || data.userMessage) {
        const text = (data.userMessage || data.content || '').trim();
        if (!text) return;

        if (data.candidateName) candidateName = data.candidateName;
        if (data.resumeText) resumeText = data.resumeText;

        console.log('[User Speech Received]:', text);
        history.push({ role: 'user', content: text });

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
