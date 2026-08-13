import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = 'ws://localhost:5050';

/**
 * Ultra Low-Latency Hands-Free Real-Time Voice Agent Hook
 * Features:
 * 1. Infinite Auto-Restart Speech Recognition Loop (Prevents Mic Silence Death)
 * 2. 20-Second WebSocket Keep-Alive Ping/Pong & Auto-Reconnect
 * 3. UI State Lock Reset on Socket Close/Error
 * 4. Safe Base64 Audio Decoding & Single High-Quality Neural Audio Block Handling
 */
export function useInterviewSocket(resumeText = '', candidateName = 'Manik', enabled = true) {
  const [aiText, setAiText] = useState('');
  const [status, setStatus] = useState(enabled ? 'connecting' : 'idle'); // idle | connecting | listening | ai_thinking | ai_speaking | error
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState([]);

  // Persistent Refs
  const fullTranscriptRef = useRef([]);
  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const audioQueueRef = useRef([]);
  const recognitionRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const vadIntervalRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const hasReceivedAudioRef = useRef(false);

  // Buffer for accumulated user transcript & latest AI text ref
  const transcriptBufferRef = useRef('');
  const aiTextRef = useRef('');

  // Context refs for WebSocket
  const candidateNameRef = useRef(candidateName);
  const resumeTextRef = useRef(resumeText);
  candidateNameRef.current = candidateName;
  resumeTextRef.current = resumeText;

  // Flags
  const isAiSpeakingRef = useRef(false);
  const isUserSpeakingRef = useRef(false);
  const isRecordingRef = useRef(true);
  const isMicStartingRef = useRef(false);
  const mountedRef = useRef(true);

  // Sync aiTextRef
  useEffect(() => {
    aiTextRef.current = aiText;
  }, [aiText]);

  // ── Instant Conversational Thinking Fillers ──
  const playInstantFiller = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    const fillers = ["Hmm...", "Let me see...", "Got it...", "Right..."];
    const randomFiller = fillers[Math.floor(Math.random() * fillers.length)];
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(randomFiller);
      utterance.rate = 1.25;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      // ignore
    }
  }, []);

  // ── Browser SpeechSynthesis Fallback ──
  const speakTextFallback = useCallback((text) => {
    const textToSpeak = text || aiTextRef.current;
    if (!('speechSynthesis' in window) || !textToSpeak) {
      setStatus('listening');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Alex')));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        isAiSpeakingRef.current = true;
        setStatus('ai_speaking');
      };

      utterance.onend = () => {
        isAiSpeakingRef.current = false;
        setStatus('listening');
      };

      utterance.onerror = () => {
        isAiSpeakingRef.current = false;
        setStatus('listening');
      };

      isAiSpeakingRef.current = true;
      setStatus('ai_speaking');
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis exception:', err);
      isAiSpeakingRef.current = false;
      setStatus('listening');
    }
  }, []);

  // ── Smooth 300ms Fade-Out Barge-In ──
  const stopAudio = useCallback(() => {
    audioQueueRef.current = [];

    if (audioRef.current) {
      try {
        console.log('🔇 [Smooth Barge-In] Fading out AI audio over 300ms');
        let volume = audioRef.current.volume || 1.0;
        const currentAudio = audioRef.current;
        audioRef.current = null;

        const fadeInterval = setInterval(() => {
          if (volume > 0.15) {
            volume -= 0.15;
            try { currentAudio.volume = Math.max(0, volume); } catch (e) {}
          } else {
            clearInterval(fadeInterval);
            try {
              currentAudio.pause();
              currentAudio.currentTime = 0;
            } catch (e) {}
          }
        }, 30);
      } catch (e) {
        // ignore
      }
    }

    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }

    isAiSpeakingRef.current = false;
    setStatus('listening');
  }, []);

  // ── Send Interrupt Signal to Backend ──
  const sendInterrupt = useCallback(() => {
    stopAudio();

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = { type: 'interrupt' };
      console.log('⬆️ Sending interrupt payload to server');
      try {
        socketRef.current.send(JSON.stringify(payload));
      } catch (e) {
        // ignore
      }
    }
  }, [stopAudio]);

  // ── Audio Queue System ──
  const playNextInQueue = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isAiSpeakingRef.current = false;
      setStatus('listening');
      return;
    }

    isAiSpeakingRef.current = true;
    setStatus('ai_speaking');
    const base64 = audioQueueRef.current.shift();

    if (!base64 || typeof base64 !== 'string') {
      playNextInQueue();
      return;
    }

    try {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(blob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        isAiSpeakingRef.current = true;
        console.log('🔊 Playing Neural audio payload...');
      };

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        isAiSpeakingRef.current = false;
        playNextInQueue();
      };

      audio.onerror = (e) => {
        console.error('🔊 Neural audio error. Skipping chunk:', e);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        isAiSpeakingRef.current = false;
        playNextInQueue();
      };

      audio.play().catch((err) => {
        console.warn('🔊 Audio play blocked or failed. Skipping chunk:', err);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        isAiSpeakingRef.current = false;
        playNextInQueue();
      });
    } catch (e) {
      console.warn('Audio base64 decoding exception, skipping chunk:', e);
      audioRef.current = null;
      isAiSpeakingRef.current = false;
      playNextInQueue();
    }
  }, []);

  const enqueueAudio = useCallback((base64Data) => {
    if (!base64Data) return;
    audioQueueRef.current.push(base64Data);
    if (!isAiSpeakingRef.current && !audioRef.current) {
      playNextInQueue();
    }
  }, [playNextInQueue]);

  // Transcript entry logger
  const addTranscriptEntry = useCallback((role, content) => {
    const entry = { role, content };
    fullTranscriptRef.current = [...fullTranscriptRef.current, entry];
    setFullTranscript(fullTranscriptRef.current);
  }, []);

  // ── Send User Speech Payload ──
  const sendUserSpeech = useCallback((textToSend) => {
    const trimmed = textToSend.trim();
    if (!trimmed || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    playInstantFiller();
    addTranscriptEntry('user', trimmed);

    const payload = {
      type: 'user_speech',
      userMessage: trimmed,
      resumeText: resumeTextRef.current,
      candidateName: candidateNameRef.current
    };

    console.log('⬆️ Sending user speech payload to server:', payload);
    setStatus('ai_thinking');
    setTranscript('');
    transcriptBufferRef.current = '';

    try {
      socketRef.current.send(JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to send user speech over socket:', e);
    }
  }, [playInstantFiller, addTranscriptEntry]);

  // ── VAD Volume Calculation ──
  const setupVAD = useCallback((stream) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const RMS_THRESHOLD = 35; // Increased threshold for noise rejection

      vadIntervalRef.current = setInterval(() => {
        if (!mountedRef.current) return;

        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);

        if (rms > RMS_THRESHOLD) {
          if (!isUserSpeakingRef.current) {
            isUserSpeakingRef.current = true;
            console.log('🗣️ User VAD activity detected, RMS:', Math.round(rms));

            if (isAiSpeakingRef.current && transcriptBufferRef.current.trim().length >= 3) {
              sendInterrupt();
            }

            setStatus('listening');
          }
        } else {
          isUserSpeakingRef.current = false;
        }
      }, 100);
    } catch (err) {
      console.warn('VAD setup error:', err);
    }
  }, [sendInterrupt]);

  // ── Helper to Safely Start Speech Recognition ──
  const safeStartRecognition = useCallback(() => {
    if (!recognitionRef.current || !mountedRef.current || !isRecordingRef.current) return;
    if (isMicStartingRef.current) return;

    try {
      isMicStartingRef.current = true;
      recognitionRef.current.start();
      console.log('🎙️ Calling recognition.start()...');
    } catch (e) {
      isMicStartingRef.current = false;
    }
  }, []);

  // ── Speech Recognition Auto-Restart Loop ──
  const setupSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    if (recognitionRef.current) {
      safeStartRecognition();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isMicStartingRef.current = false;
      console.log('🎙️ Mic started listening');
    };

    recognition.onresult = (event) => {
      let currentTranscript = '';
      let isFinalResult = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          isFinalResult = true;
        }
      }

      const trimmed = currentTranscript.trim();
      // Ignore phantom noise: require at least 3 characters for barge-in interrupt or submission
      if (trimmed.length >= 3) {
        if (isAiSpeakingRef.current) {
          console.log('🗣️ Candidate real voice input detected during AI turn (>2 chars)! Smooth fading out AI audio...');
          sendInterrupt();
        }

        const lastSnippet = event.results[event.results.length - 1][0].transcript;
        console.log('📝 Transcript received:', lastSnippet, isFinalResult ? '(FINAL)' : '(INTERIM)');
        transcriptBufferRef.current = trimmed;
        setTranscript(trimmed);

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        silenceTimerRef.current = setTimeout(() => {
          silenceTimerRef.current = null;
          console.log('🎤 1.5s Silence detected after speech. Submitting transcript...');
          const finalSpeech = transcriptBufferRef.current.trim();
          if (finalSpeech.length >= 3) {
            sendUserSpeech(finalSpeech);
          }
        }, 1500);
      }
    };

    recognition.onerror = (event) => {
      isMicStartingRef.current = false;
      console.error('🎙️ Mic error:', event.error);

      if (mountedRef.current && isRecordingRef.current) {
        setTimeout(() => {
          if (mountedRef.current && isRecordingRef.current) {
            safeStartRecognition();
          }
        }, 800);
      }
    };

    recognition.onend = () => {
      isMicStartingRef.current = false;
      console.log('🎙️ Mic stopped listening. Auto-restarting loop...');

      if (mountedRef.current && isRecordingRef.current) {
        setTimeout(() => {
          if (mountedRef.current && isRecordingRef.current) {
            safeStartRecognition();
          }
        }, 400);
      }
    };

    recognitionRef.current = recognition;
    safeStartRecognition();
  }, [sendInterrupt, safeStartRecognition, sendUserSpeech]);

  // ── WebSocket Setup (20s Keep-Alive Ping & Auto-Reconnect) ──
  const connectWebSocket = useCallback(() => {
    if (!mountedRef.current) return;

    if (socketRef.current) {
      const state = socketRef.current.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        return;
      }
    }

    try {
      console.log('⚡ Opening WebSocket connection to:', WS_URL);
      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('⚡ Connected to AI Interviewer WebSocket');
        setIsConnected(true);
        setStatus('ai_thinking');

        // Start 20-second Keep-Alive Ping
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);

        const initPayload = {
          type: 'init_context',
          candidateName: candidateNameRef.current,
          resumeText: resumeTextRef.current
        };
        ws.send(JSON.stringify(initPayload));
        setupSpeechRecognition();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'ping') {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'pong' }));
            }
            return;
          }

          if (data.type === 'text_chunk' && data.content) {
            if (data.fullText) {
              setAiText(data.fullText);
              aiTextRef.current = data.fullText;
            }
            setStatus('ai_speaking');
          }

          if (data.type === 'text' && data.content) {
            handleWsMessage(data);
          }

          const audioPayload = data.audioBase64 || data.audioContent;
          if ((data.type === 'audio_chunk' || data.type === 'audio') && audioPayload) {
            hasReceivedAudioRef.current = true;
            enqueueAudio(audioPayload);
          }

          if (data.type === 'error') {
            console.error('[Server Error]', data.message);
            setStatus('error');
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onclose = (event) => {
        console.warn('⚡ WebSocket closed (code:', event.code, ').');
        setIsConnected(false);
        isAiSpeakingRef.current = false;
        isUserSpeakingRef.current = false;
        audioQueueRef.current = [];

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        if (mountedRef.current && isRecordingRef.current) {
          setStatus('connecting');
          if (!reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null;
              if (mountedRef.current && isRecordingRef.current) {
                connectWebSocket();
              }
            }, 3000);
          }
        }
      };

      ws.onerror = (err) => {
        console.warn('⚡ WebSocket error:', err);
        setIsConnected(false);
        isAiSpeakingRef.current = false;
        isUserSpeakingRef.current = false;
        setStatus('error');
      };
    } catch (err) {
      console.error('WebSocket setup error:', err);
      if (mountedRef.current && isRecordingRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          if (mountedRef.current) connectWebSocket();
        }, 3000);
      }
    }
  }, [setupSpeechRecognition, enqueueAudio, speakTextFallback]);



  // WebSocket message handler updates
  const handleWsMessage = useCallback((data) => {
    if (data.type === 'text' && data.content) {
      setAiText(data.content);
      aiTextRef.current = data.content;
      addTranscriptEntry('assistant', data.content);
      setStatus('ai_speaking');
      hasReceivedAudioRef.current = false;

      setTimeout(() => {
        if (!hasReceivedAudioRef.current && mountedRef.current && isRecordingRef.current) {
          console.log('🔊 Using zero-cost browser SpeechSynthesis fallback...');
          speakTextFallback(data.content);
        }
      }, 600);
    }
  }, [addTranscriptEntry, speakTextFallback]);

  // ── Main Effect (Runs when enabled is true) ──
  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return;
    }

    mountedRef.current = true;
    isRecordingRef.current = true;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        streamRef.current = stream;

        if (!mountedRef.current) return;

        setupVAD(stream);
        connectWebSocket();
      } catch (err) {
        console.error('Microphone access denied:', err);
        setStatus('error');
      }
    };

    init();

    return () => {
      mountedRef.current = false;
      isRecordingRef.current = false;

      if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

      stopAudio();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (socketRef.current) {
        console.log('⚡ [Cleanup] Closing WebSocket on unmount.');
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [enabled, setupVAD, connectWebSocket, stopAudio]);

  const endSession = useCallback(() => {
    isRecordingRef.current = false;
    mountedRef.current = false;
    stopAudio();

    if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      try { streamRef.current.getTracks().forEach((t) => t.stop()); } catch (e) {}
    }
    if (socketRef.current) {
      try { socketRef.current.close(); } catch (e) {}
      socketRef.current = null;
    }
    setIsConnected(false);
    setStatus('idle');
  }, [stopAudio]);

  return {
    aiText,
    status,
    isConnected,
    transcript,
    fullTranscript,
    fullTranscriptRef,
    sendInterrupt,
    endSession
  };
}

