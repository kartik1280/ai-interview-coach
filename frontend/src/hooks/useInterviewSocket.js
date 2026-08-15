import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = 'ws://localhost:5001';

/**
 * Hands-Free Real-Time Voice Agent Hook
 * Architectural Fixes Applied:
 * 1. Strict WebSocket Cleanup: prevents React StrictMode double connection & duplicate greetings
 * 2. Mic "Aborted" Loop Guard: isMicStartingRef guard + 1000ms delay on 'aborted' error
 * 3. Non-Destructive Barge-In: audio.pause() without killing SpeechRecognition
 */
export function useInterviewSocket(resumeText = '', candidateName = 'Manik') {
  const [aiText, setAiText] = useState('');
  const [status, setStatus] = useState('connecting'); // connecting | listening | ai_thinking | ai_speaking | error
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState('');

  // Persistent Refs
  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const audioQueueRef = useRef([]);
  const recognitionRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const streamRef = useRef(null);
  const vadIntervalRef = useRef(null);
  const silenceTimerRef = useRef(null);

  // Buffer for accumulated user transcript
  const transcriptBufferRef = useRef('');

  // Flags
  const isAiSpeakingRef = useRef(false);
  const isUserSpeakingRef = useRef(false);
  const isRecordingRef = useRef(true);
  const isMicStartingRef = useRef(false); // FIX 2: Prevents mic collision loops
  const mountedRef = useRef(true);

  // ── FIX 3: Non-Destructive Barge-In (Pause audio only, do not kill STT) ──
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      try {
        console.log('🔇 [Barge-In] Pausing AI audio output');
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {
        // ignore
      }
      audioRef.current = null;
    }
    audioQueueRef.current = [];
    isAiSpeakingRef.current = false;
    setStatus('listening');
  }, []);

  // ── Send Interrupt Signal to Backend ──
  const sendInterrupt = useCallback(() => {
    stopAudio();

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const payload = { type: 'interrupt' };
      console.log('⬆️ Sending payload to server:', payload);
      socketRef.current.send(JSON.stringify(payload));
    }
  }, [stopAudio]);

  // ── Send User Speech Payload over WebSocket ──
  const sendUserSpeech = useCallback((textToSend) => {
    const trimmed = textToSend.trim();
    if (!trimmed || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = {
      type: 'user_speech',
      userMessage: trimmed,
      resumeText,
      candidateName
    };

    console.log('⬆️ Sending payload to server:', payload);
    setStatus('ai_thinking');
    setTranscript('');
    transcriptBufferRef.current = '';

    socketRef.current.send(JSON.stringify(payload));
  }, [resumeText, candidateName]);

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

    try {
      const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
      audioRef.current = audio;

      audio.onplay = () => {
        isAiSpeakingRef.current = true;
        console.log('🔊 AI Audio playing...');
      };

      audio.onended = () => {
        console.log('🔊 AI Audio ended.');
        audioRef.current = null;
        isAiSpeakingRef.current = false;
        playNextInQueue();
      };

      audio.onerror = (e) => {
        console.error('🔊 AI Audio error:', e);
        audioRef.current = null;
        isAiSpeakingRef.current = false;
        playNextInQueue();
      };

      audio.play().catch((err) => {
        console.warn('🔊 Audio play prevented:', err);
        audioRef.current = null;
        isAiSpeakingRef.current = false;
        playNextInQueue();
      });
    } catch (e) {
      console.warn('Audio init exception:', e);
      isAiSpeakingRef.current = false;
      playNextInQueue();
    }
  }, []);

  const enqueueAudio = useCallback((base64Data) => {
    audioQueueRef.current.push(base64Data);
    if (!isAiSpeakingRef.current && !audioRef.current) {
      playNextInQueue();
    }
  }, [playNextInQueue]);

  // ── VAD (Volume RMS Calculation via Web Audio API) ──
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
      const RMS_THRESHOLD = 20;
      const SILENCE_DURATION_MS = 1500;

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
            console.log('🗣️ User started speaking (barge-in triggered), RMS:', Math.round(rms));

            if (isAiSpeakingRef.current) {
              sendInterrupt();
            }

            setStatus('listening');
          }

          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        } else {
          if (isUserSpeakingRef.current && !silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              isUserSpeakingRef.current = false;
              silenceTimerRef.current = null;
              console.log('🎤 [VAD] 1.5s Silence detected. Flushing user transcript buffer...');

              const finalSpeech = transcriptBufferRef.current.trim();
              if (finalSpeech.length > 0) {
                sendUserSpeech(finalSpeech);
              }
            }, SILENCE_DURATION_MS);
          }
        }
      }, 100);
    } catch (err) {
      console.warn('VAD setup error:', err);
    }
  }, [sendInterrupt, sendUserSpeech]);

  // ── Helper to Safely Start Speech Recognition ──
  const safeStartRecognition = useCallback(() => {
    if (!recognitionRef.current || !mountedRef.current || !isRecordingRef.current) return;
    if (isMicStartingRef.current) {
      console.log('⏸️ [Mic Guard] Recognition start already in progress. Skipping...');
      return;
    }

    try {
      isMicStartingRef.current = true;
      recognitionRef.current.start();
      console.log('🎙️ Calling recognition.start()...');
    } catch (e) {
      isMicStartingRef.current = false;
      console.warn('SpeechRecognition start call exception:', e.message);
    }
  }, []);

  // ── FIX 2: Speech Recognition with Aborted Error Loop Protection & Ref Guards ──
  const setupSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    // If an instance already exists, don't recreate it
    if (recognitionRef.current) {
      safeStartRecognition();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isMicStartingRef.current = false; // Reset flag on successful start
      console.log('🎙️ Mic started listening');
    };

    recognition.onspeechstart = () => {
      console.log('🗣️ User started speaking (onspeechstart)');
      if (isAiSpeakingRef.current) {
        sendInterrupt();
      }
    };

    recognition.onsoundstart = () => {
      if (isAiSpeakingRef.current) {
        sendInterrupt();
      }
    };

    recognition.onresult = (event) => {
      // Ignore self-echo if AI is actively playing audio
      if (isAiSpeakingRef.current) {
        console.log('🔇 AI speaking — ignoring self-echo transcript.');
        return;
      }

      let currentTranscript = '';
      let isFinalResult = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          isFinalResult = true;
        }
      }

      const trimmed = currentTranscript.trim();
      if (trimmed) {
        const lastSnippet = event.results[event.results.length - 1][0].transcript;
        console.log('📝 Transcript received:', lastSnippet, isFinalResult ? '(FINAL)' : '(INTERIM)');
        transcriptBufferRef.current = trimmed;
        setTranscript(trimmed);
      }
    };

    // FIX 2: Handle 'aborted' error without infinite loop
    recognition.onerror = (event) => {
      isMicStartingRef.current = false;
      console.error('🎙️ Mic error:', event.error);

      if (event.error === 'aborted') {
        console.warn('⏸️ [Mic Aborted] Delaying restart by 1000ms to clear audio buffers...');
        if (mountedRef.current && isRecordingRef.current) {
          setTimeout(() => {
            if (mountedRef.current && isRecordingRef.current) {
              safeStartRecognition();
            }
          }, 1000);
        }
      }
    };

    recognition.onend = () => {
      isMicStartingRef.current = false;
      console.log('🎙️ Mic stopped listening. Auto-restarting...');

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
  }, [sendInterrupt, safeStartRecognition]);

  // ── FIX 1: WebSocket Setup with Duplicate Connection Prevention & Strict Cleanup ──
  const connectWebSocket = useCallback(() => {
    if (!mountedRef.current) return;

    // Prevent duplicate WebSockets in React Strict Mode
    if (socketRef.current) {
      const state = socketRef.current.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        console.log('⚡ [WS Guard] WebSocket already open/connecting. Skipping creation...');
        return;
      }
    }

    try {
      console.log('⚡ Opening new WebSocket connection to:', WS_URL);
      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('⚡ Connected to AI Interviewer WebSocket');
        setIsConnected(true);
        setStatus('ai_thinking');

        const initPayload = {
          type: 'init_context',
          candidateName,
          resumeText
        };
        console.log('⬆️ Sending payload to server:', initPayload);
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

          if (data.type === 'text' && data.content) {
            setAiText(data.content);
            setStatus('ai_speaking');
          }

          if (data.type === 'audio' && data.audioBase64) {
            enqueueAudio(data.audioBase64);
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
  }, [candidateName, resumeText, setupSpeechRecognition, enqueueAudio]);

  // ── Main Effect with Strict Cleanup ──
  useEffect(() => {
    mountedRef.current = true;
    isRecordingRef.current = true;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

    // Strict Mode / Component Unmount Cleanup
    return () => {
      mountedRef.current = false;
      isRecordingRef.current = false;

      if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

      stopAudio();

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      // FIX 1: Explicitly close WebSocket on unmount to prevent zombie duplicate connections
      if (socketRef.current) {
        console.log('⚡ [Cleanup] Closing WebSocket on unmount.');
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [setupVAD, connectWebSocket, stopAudio]);

  const endSession = useCallback(() => {
    isRecordingRef.current = false;
    stopAudio();

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
    setStatus('connecting');
  }, [stopAudio]);

  return {
    aiText,
    status,
    isConnected,
    transcript,
    sendInterrupt,
    endSession
  };
}
