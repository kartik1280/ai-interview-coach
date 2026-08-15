import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { EdgeTTS } from 'node-edge-tts';
import multer from 'multer';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import os from 'os';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');


dotenv.config();

const app = express();
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('error', (err) => {
  console.warn('[WSS Server Warning]:', err.message);
});

const PORT = process.env.PORT || 5050;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel default
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// Memory storage for multer (zero temporary files on disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const extractNameFromResume = async (resumeText) => {
  if (!groq || !resumeText || resumeText.length < 10) return '';
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a precise data extractor. Extract ONLY the full name of the candidate from the provided resume text. Return ONLY JSON format: {"candidateName": "Full Name"}. If no candidate name is present, return {"candidateName": ""}.'
        },
        {
          role: 'user',
          content: resumeText.substring(0, 1500)
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens: 60,
      response_format: { type: 'json_object' }
    });
    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const name = parsed.candidateName || '';
    return name.replace(/^["']|["']$/g, '').trim();
  } catch (error) {
    console.error('Failed to extract name from resume:', error.message);
    return '';
  }
};

const buildSystemPrompt = (accountOwner = 'Candidate', resumeText = '', resumeCandidateName = '') => {
  const cleanResume = (resumeText || '').trim() || 'Candidate pursuing Software Engineering with experience in React, Node.js, and modern web application development.';
  
  const safeAccountOwner = accountOwner || 'Candidate';
  const safeResumeName = resumeCandidateName || '';

  let identityInstruction = '';
  if (
    safeResumeName &&
    safeAccountOwner &&
    !safeResumeName.toLowerCase().includes(safeAccountOwner.toLowerCase()) &&
    !safeAccountOwner.toLowerCase().includes(safeResumeName.toLowerCase())
  ) {
    identityInstruction = `CRITICAL INSTRUCTION: The logged-in account belongs to ${safeAccountOwner}, but the uploaded resume is for ${safeResumeName}. 
Before starting the interview or asking any technical questions, politely acknowledge this. Ask the user to confirm their identity (e.g., "I see you're logged in as ${safeAccountOwner}, but the resume is for ${safeResumeName}. Are you ${safeResumeName} practicing on a friend's account?"). 
Do not proceed with technical interview questions until they clarify their identity.`;
  } else {
    const nameToGreet = safeResumeName || safeAccountOwner;
    identityInstruction = `Start the interview by warmly welcoming ${nameToGreet} and briefly acknowledging a specific project or skill from their resume.`;
  }

  return {
    role: 'system',
    content: `You are an expert technical interviewer conducting a 5-minute screening round. Keep your tone completely normal, conversational, and friend-like. Do not sound formal, robotic, or overly enthusiastic.

Account Owner (Logged In): ${accountOwner}
Resume Candidate Name: ${resumeCandidateName || accountOwner}
Current Time Context: ${getTimeOfDay()}

${identityInstruction}

Here is the candidate's parsed resume data:
<resume>
${cleanResume}
</resume>

Instructions:
1. Follow the identity instruction above if applicable. If names match or no discrepancy, ask only ONE short question at a time.
2. Listen to their response, provide brief, natural feedback (e.g., 'Got it, that makes sense,' or 'Hmm, good point,'), and ask a logical follow-up.
3. STRICT ANTI-REPETITION: Never repeat questions or statements previously asked in the conversation history. Always move the conversation forward with fresh questions. If candidate input is brief or unclear, ask for clarification once politely.
4. CRITICAL FOR VOICE RHYTHM: Speak in short, natural sentences (1-3 sentences max per turn). Use em-dashes (—) for natural conversational pauses and ellipses (...) when trailing off or thinking.
5. NO markdown, NO bullet points, NO code blocks, NO emojis, NO asterisks. You are speaking out loud over a live audio stream.`
  };
};

// ── Multi-Provider Humanized TTS Generator ──
const generateTTSAudioBuffer = async (text, signal = null) => {
  if (signal?.aborted) return null;

  // Provider 1: ElevenLabs API (if key provided)
  if (ELEVENLABS_API_KEY) {
    try {
      console.log(`[ElevenLabs TTS] Requesting voice synthesis (Voice ID: ${ELEVENLABS_VOICE_ID})...`);
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          }
        }),
        signal
      });
      if (response.ok && !signal?.aborted) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log(`[ElevenLabs TTS] ✅ Success! Generated ${buffer.length} bytes MP3 audio buffer.`);
        return signal?.aborted ? null : buffer;
      }
      const errBody = await response.text();
      console.warn(`[ElevenLabs Error] HTTP status: ${response.status} - ${errBody}`);
    } catch (err) {
      if (err.name === 'AbortError' || signal?.aborted) {
        console.log('[ElevenLabs TTS] Aborted TTS generation request.');
        return null;
      }
      console.error('[ElevenLabs Exception]', err.message);
    }
  }

  if (signal?.aborted) return null;

  // Provider 2: OpenAI TTS (if key provided)
  if (OPENAI_API_KEY) {
    try {
      console.log('[OpenAI TTS] Generating voice output...');
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'alloy'
        }),
        signal
      });
      if (response.ok && !signal?.aborted) {
        const arrayBuffer = await response.arrayBuffer();
        return signal?.aborted ? null : Buffer.from(arrayBuffer);
      }
    } catch (err) {
      if (err.name === 'AbortError' || signal?.aborted) return null;
      console.error('[OpenAI TTS Error]', err.message);
    }
  }

  if (signal?.aborted) return null;

  // Provider 3: High-Quality Edge Neural TTS Fallback (Zero cost out-of-the-box)
  console.log('[Edge TTS] Generating Neural Voice output...');
  const tts = new EdgeTTS({
    voice: 'en-US-ChristopherNeural',
    lang: 'en-US',
    outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
  });

  const tempFile = path.join(os.tmpdir(), `tts_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);
  await tts.ttsPromise(text, tempFile);

  if (signal?.aborted) {
    try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch (e) {}
    return null;
  }

  if (fs.existsSync(tempFile)) {
    const audioBuffer = fs.readFileSync(tempFile);
    try { fs.unlinkSync(tempFile); } catch (e) {}
    return signal?.aborted ? null : audioBuffer;
  }

  throw new Error('Failed to generate TTS audio buffer');
};

// ── Robust PDF Text Extraction Helper ──
const extractPdfText = async (buffer) => {
  try {
    if (typeof pdfParse === 'function') {
      const res = await pdfParse(buffer);
      if (res && res.text) return res.text;
    }
    if (pdfParse && typeof pdfParse.default === 'function') {
      const res = await pdfParse.default(buffer);
      if (res && res.text) return res.text;
    }
    if (pdfParse && pdfParse.PDFParse) {
      const instance = new pdfParse.PDFParse({ data: buffer });
      const res = await instance.getText();
      if (typeof res === 'string') return res;
      if (res && res.text) return res.text;
    }
  } catch (e) {
    console.warn('[PDF Parsing Engine Notice]:', e.message);
  }

  // Safe fallback: clean text extraction from buffer
  const raw = buffer.toString('utf-8');
  return raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
};

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    port: PORT,
    groqConfigured: !!GROQ_API_KEY,
    elevenLabsConfigured: !!ELEVENLABS_API_KEY,
    openAIConfigured: !!OPENAI_API_KEY
  });
});

// ── Resume PDF Parsing Endpoint (In-Memory Buffer) ──
app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    console.log(`📄 Parsing resume in memory: ${req.file.originalname} (${req.file.size} bytes)`);

    let extractedText = '';

    // Extract text from uploaded buffer
    if (req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf')) {
      extractedText = await extractPdfText(req.file.buffer);
    } else {
      extractedText = req.file.buffer.toString('utf-8');
    }

    // Clean up excessive whitespace
    extractedText = extractedText.replace(/\s+/g, ' ').trim();

    if (!extractedText || extractedText.length < 10) {
      return res.status(422).json({ error: 'Could not extract readable text from uploaded resume PDF.' });
    }

    console.log('✅ Successfully extracted resume text snippet:', extractedText.substring(0, 120) + '...');

    // Extract candidate name from resume text using Groq LLM
    let resumeCandidateName = '';
    if (extractedText) {
      resumeCandidateName = await extractNameFromResume(extractedText);
    }
    console.log('✅ Extracted resume candidate name:', resumeCandidateName || '(None)');

    res.json({
      success: true,
      filename: req.file.originalname,
      resumeText: extractedText,
      resumeCandidateName
    });
  } catch (err) {
    console.error('❌ Resume parse error:', err);
    res.status(500).json({ error: `Failed to parse resume: ${err.message}` });
  }
});

// ── End-of-Interview LLM Scoring & Feedback Endpoint ──
app.post('/api/evaluate-interview', async (req, res) => {
  try {
    const { transcript, full_chat_history } = req.body;

    let chatText = '';

    if (Array.isArray(transcript) && transcript.length > 0) {
      chatText = transcript
        .map(t => `${t.role === 'user' ? 'Candidate' : 'Interviewer'}: ${t.content}`)
        .join('\n');
    } else if (typeof full_chat_history === 'string' && full_chat_history.trim()) {
      chatText = full_chat_history;
    } else {
      // Demo transcript fallback for direct API testing
      chatText = `Interviewer: Hi Manik! I noticed on your resume that you built a React application using Vite. Can you tell me why you chose Vite over Create React App or Webpack?
Candidate: Vite uses native ES modules during development and esbuild for bundling, which makes hot module replacement insanely fast compared to Webpack.
Interviewer: That makes sense! How do you handle state management in larger React apps?
Candidate: For local state I use useState and useReducer. For global app state, I prefer lightweight solutions like Zustand or React Context for smaller sub-trees.
Interviewer: Got it! How does the Virtual DOM diffing algorithm optimize DOM updates?
Candidate: The Virtual DOM creates an in-memory representation. React diffs the old and new trees using a fiber reconciliation algorithm, batching real DOM writes so it updates only altered nodes.`;
    }

    if (!groq) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured on backend server.' });
    }

    console.log('📊 Scoring interview transcript via Groq Llama-3.3-70b...');

    const prompt = `Analyze the following interview transcript. Grade the candidate strictly but fairly on a scale of 1-10 in three categories: Technical Accuracy, Sentence Formation, and Communication Confidence.

Transcript:
${chatText}

Return the output EXACTLY in this JSON format:
{
  "overall_score": 8,
  "technical_accuracy": {
    "score": 8,
    "feedback": "Solid understanding of the Virtual DOM and Vite, but could elaborate more on build pipelines."
  },
  "sentence_formation": {
    "score": 8,
    "feedback": "Articulate and concise answers with minimal hesitation."
  },
  "communication_confidence": {
    "score": 9,
    "feedback": "Spoke with high confidence and structured thoughts logically."
  },
  "suggested_improvement": "Review advanced Vite configuration options and Webpack chunking strategies to answer follow-ups with greater depth."
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an expert technical interview evaluator. You return strict JSON evaluation scorecards.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const rawJson = completion.choices[0]?.message?.content || '{}';
    const scorecard = JSON.parse(rawJson);

    console.log('✅ Evaluation Scorecard Generated:', scorecard.overall_score);

    res.json({
      success: true,
      scorecard
    });
  } catch (err) {
    console.error('❌ Evaluation endpoint error:', err);
    res.status(500).json({ error: `Failed to score interview transcript: ${err.message}` });
  }
});

// ── WebSocket Real-Time Voice Handling ──
wss.on('connection', (ws) => {
  console.log('⚡ Client connected to real-time voice socket');

  let abortController = null;
  let isInterrupted = false;
  let history = [];
  let candidateName = 'Manik';
  let resumeCandidateName = '';
  let resumeText = '';

  // Heartbeat Ping
  const heartbeat = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }));
    }
  }, 15000);

  const generateTurn = async () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }

    isInterrupted = false;
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

      const systemPrompt = buildSystemPrompt(candidateName, resumeText, resumeCandidateName);
      const groqMessages = [systemPrompt, ...history];

      console.log('[Groq Streaming] Generating response turn...');
      const stream = await groq.chat.completions.create({
        messages: groqMessages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.65,
        frequency_penalty: 0.8,
        presence_penalty: 0.3,
        max_tokens: 160,
        stream: true
      });

      let accumulatedText = '';

      for await (const chunk of stream) {
        if (signal.aborted || isInterrupted || ws.readyState !== WebSocket.OPEN) break;

        const content = chunk.choices[0]?.delta?.content || '';
        if (!content) continue;

        accumulatedText += content;

        if (!signal.aborted && !isInterrupted && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'text_chunk',
            content,
            fullText: accumulatedText
          }));
        }
      }

      const finalAiText = accumulatedText.trim();
      if (finalAiText && !signal.aborted && !isInterrupted) {
        console.log('[AI Output Stream Completed]:', finalAiText);
        history.push({ role: 'assistant', content: finalAiText });

        if (ws.readyState === WebSocket.OPEN && !signal.aborted && !isInterrupted) {
          ws.send(JSON.stringify({
            type: 'text',
            content: finalAiText,
            fullHistory: history
          }));
        }

        // Generate Audio Buffer using multi-provider TTS
        if (!signal.aborted && !isInterrupted) {
          try {
            const audioBuffer = await generateTTSAudioBuffer(finalAiText, signal);

            if (!signal.aborted && !isInterrupted && ws.readyState === WebSocket.OPEN && audioBuffer) {
              const base64Audio = audioBuffer.toString('base64');
              console.log('[TTS Audio] Base64 audio block sent to client.');
              ws.send(JSON.stringify({
                type: 'audio',
                audioBase64: base64Audio,
                audioContent: base64Audio
              }));
            }
          } catch (ttsErr) {
            console.error('[TTS Error]', ttsErr.message);
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError' || signal.aborted || isInterrupted) {
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
        console.log('⚡ [Interrupt] Client barge-in received. Aborting active turn...');
        isInterrupted = true;
        if (abortController) {
          abortController.abort();
          abortController = null;
        }
        return;
      }

      if (data.type === 'pong') return;

      if (data.type === 'init_context') {
        if (data.candidateName) candidateName = data.candidateName;
        if (data.resumeCandidateName) resumeCandidateName = data.resumeCandidateName;
        if (data.resumeText) resumeText = data.resumeText;
        return;
      }

      if (data.type === 'user_speech' || data.userMessage) {
        const text = (data.userMessage || data.content || '').trim();
        if (!text) return;

        if (data.candidateName) candidateName = data.candidateName;
        if (data.resumeCandidateName) resumeCandidateName = data.resumeCandidateName;
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

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is busy (EADDRINUSE). Attempting fallback binding...`);
    setTimeout(() => {
      try { server.close(); } catch (e) {}
      server.listen(Number(PORT) + 1);
    }, 1000);
  } else {
    console.error('Server startup error:', err);
  }
});

server.listen(PORT, () => {
  const addr = server.address();
  const actualPort = addr && typeof addr === 'object' ? addr.port : PORT;
  console.log(`🚀 Hands-Free Real-Time Voice Agent Server running on port ${actualPort}`);
});

