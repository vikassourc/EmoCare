import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Volume2, Loader2, StopCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function VoiceCompanion() {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [messages, setMessages]       = useState([]);
  const [sessionId, setSessionId]     = useState(null);
  const [micError, setMicError]       = useState('');
  const [voicesReady, setVoicesReady] = useState(false);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const isListeningRef = useRef(false); // mirror state for async callbacks
  const intentionalStop = useRef(false);
  const ttsUnlocked = useRef(false); // tracks whether speechSynthesis has been user-gesture unlocked
  const sessionIdRef = useRef(null); // Fix closure issue for sessionId

  // Keep ref in sync
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // ─── Load voices reliably ───
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    
    const loadVoices = () => {
      const voices = synthRef.current?.getVoices();
      if (voices && voices.length > 0) {
        setVoicesReady(true);
      }
    };

    loadVoices();
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    // Chrome sometimes needs a small delay
    const timer = setTimeout(loadVoices, 500);
    return () => clearTimeout(timer);
  }, []);

  // ─── Initialize Speech Recognition ───
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError('Your browser does not support speech recognition. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Use en-US to avoid regional server 'network' errors in some environments
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const text = result[0].transcript;
      setTranscript(text);

      if (result.isFinal) {
        handleFinalTranscript(text);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      isListeningRef.current = false;
      setIsListening(false);
      
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setMicError('Microphone access denied. Please allow microphone permissions in your browser settings and reload.');
      } else if (event.error === 'no-speech') {
        setMicError('No speech detected. Tap the mic and try speaking again.');
        setTimeout(() => setMicError(''), 3000);
      } else if (event.error === 'network') {
        setMicError('Network error during speech recognition. Check your internet connection.');
        setTimeout(() => setMicError(''), 4000);
      } else if (event.error !== 'aborted') {
        setMicError(`Mic error: ${event.error}. Try again.`);
        setTimeout(() => setMicError(''), 3000);
      }
    };

    recognition.onend = () => {
      // Only restart if we didn't intentionally stop
      if (isListeningRef.current && !intentionalStop.current) {
        // Don't auto-restart, just update state
      }
      isListeningRef.current = false;
      setIsListening(false);
      intentionalStop.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      intentionalStop.current = true;
      try { recognition.stop(); } catch {}
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handle final recognized text ───
  const handleFinalTranscript = useCallback(async (text) => {
    intentionalStop.current = true;
    isListeningRef.current = false;
    setIsListening(false);
    
    if (!text.trim()) return;

    setTranscript('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsProcessing(true);

    try {
      const payload = { message: text };
      const currentSessionId = sessionIdRef.current;
      if (currentSessionId) payload.sessionId = currentSessionId;

      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('emocare_token')}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        if (!currentSessionId) {
          setSessionId(data.sessionId);
          sessionIdRef.current = data.sessionId;
        }
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        speakText(data.response);
      } else {
        setMicError('Failed to get AI response. Try again.');
        setTimeout(() => setMicError(''), 3000);
      }
    } catch (err) {
      console.error("Failed to send message", err);
      setMicError('Network error. Please check your connection.');
      setTimeout(() => setMicError(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Text-to-Speech ───
  const speakText = useCallback((text) => {
    if (!synthRef.current) {
      console.error("SpeechSynthesis not available");
      return;
    }
    
    // Clear any existing pause interval
    if (window.speechPauseInterval) {
      clearInterval(window.speechPauseInterval);
      window.speechPauseInterval = null;
    }
    
    // Strip markdown characters so it reads naturally
    const cleanText = text
      .replace(/[*_~`#]/g, '')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!cleanText) return;
    
    console.log('[TTS] Speaking:', cleanText.substring(0, 60) + '...');
    
    // Cancel any ongoing speech, then wait briefly before starting new speech.
    // Chrome needs this gap or it silently swallows the new utterance.
    synthRef.current.cancel();
    
    const doSpeak = () => {
      const voices = synthRef.current.getVoices();
      console.log('[TTS] Voices available:', voices.length);
      
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      if (voices.length > 0) {
        // STRICTLY enforce localService voices to prevent 'synthesis-failed' from cloud voices
        const localVoices = voices.filter(v => v.localService === true);
        const voicePool = localVoices.length > 0 ? localVoices : voices;
        
        const preferredVoice = 
          voicePool.find(v => v.name.toLowerCase().includes('female')) ||
          voicePool.find(v => v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen') || v.name.includes('Hazel') || v.name.includes('Catherine') || v.name.includes('Veena')) ||
          voicePool.find(v => v.lang.startsWith('en')) ||
          voicePool[0];
          
        if (preferredVoice) {
          utterance.voice = preferredVoice;
          console.log('[TTS] Using strict local voice:', preferredVoice.name, preferredVoice.lang, 'Local:', preferredVoice.localService);
        }
      }
      
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        console.log('[TTS] Started speaking');
        setIsSpeaking(true);
      };
      
      // Chrome bug workaround: keep reference so it doesn't get garbage collected
      window.currentUtterance = utterance;
      
      utterance.onend = () => {
        console.log('[TTS] Finished speaking');
        setIsSpeaking(false);
        window.currentUtterance = null;
        if (window.speechPauseInterval) {
          clearInterval(window.speechPauseInterval);
          window.speechPauseInterval = null;
        }
      };
      
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.error("[TTS] Error:", e.error);
        }
        setIsSpeaking(false);
        window.currentUtterance = null;
        if (window.speechPauseInterval) {
          clearInterval(window.speechPauseInterval);
          window.speechPauseInterval = null;
        }
      };

      synthRef.current.speak(utterance);
      console.log('[TTS] speak() called, speaking:', synthRef.current.speaking, 'pending:', synthRef.current.pending);
      
      // Chrome bug workaround: long text (>15s) pauses silently
      window.speechPauseInterval = setInterval(() => {
        if (synthRef.current && synthRef.current.speaking && !synthRef.current.paused) {
          synthRef.current.pause();
          synthRef.current.resume();
        } else if (synthRef.current && !synthRef.current.speaking) {
          clearInterval(window.speechPauseInterval);
          window.speechPauseInterval = null;
        }
      }, 12000);
    };

    // Wait 150ms after cancel() before speaking (Chrome race condition fix)
    setTimeout(doSpeak, 150);
  }, []);

  // ─── Unlock TTS (must be called from a user gesture) ───
  const unlockTTS = useCallback(() => {
    if (ttsUnlocked.current || !synthRef.current) return;
    
    // 1. Unlock Web Audio context (required by some browsers)
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume().then(() => ctx.close());
    } catch {}
    
    // 2. Speak a real word at near-zero volume to unlock speechSynthesis
    //    Empty strings are ignored by Chrome — must be a real utterance
    synthRef.current.cancel();
    const warmup = new SpeechSynthesisUtterance('.');
    warmup.volume = 0.01;
    warmup.rate = 10;
    warmup.pitch = 0.1;
    warmup.onend = () => { ttsUnlocked.current = true; };
    warmup.onerror = () => { ttsUnlocked.current = true; }; // still mark as unlocked
    synthRef.current.speak(warmup);
    ttsUnlocked.current = true;
  }, []);

  // ─── Toggle mic on/off ───
  const toggleListening = useCallback(async () => {
    setMicError('');
    
    // Unlock TTS on first user interaction
    unlockTTS();
    
    // If AI is speaking, stop it first
    if (isSpeaking) {
      synthRef.current?.cancel();
      setIsSpeaking(false);
      if (window.speechPauseInterval) {
        clearInterval(window.speechPauseInterval);
        window.speechPauseInterval = null;
      }
    }
    
    if (isListening) {
      // Stop listening
      intentionalStop.current = true;
      isListeningRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
      setTranscript('');
    } else {
      // Request microphone permission explicitly first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Permission granted — stop the stream immediately (we only needed permission)
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        console.error("Microphone permission denied:", err);
        setMicError('Microphone access denied. Please allow mic permissions in browser settings and reload the page.');
        return;
      }
      
      // Start listening
      intentionalStop.current = false;
      setTranscript('');
      try {
        recognitionRef.current?.start();
        isListeningRef.current = true;
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start recognition:", err);
        // If already started, try abort + restart
        try {
          recognitionRef.current?.abort();
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
              isListeningRef.current = true;
              setIsListening(true);
            } catch (e2) {
              setMicError('Could not start microphone. Please reload the page and try again.');
            }
          }, 200);
        } catch {
          setMicError('Could not start microphone. Please reload the page and try again.');
        }
      }
    }
  }, [isListening, isSpeaking]);

  const endCall = useCallback(() => {
    intentionalStop.current = true;
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (window.speechPauseInterval) {
      clearInterval(window.speechPauseInterval);
      window.speechPauseInterval = null;
    }
    navigate('/dashboard');
  }, [navigate]);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
    if (window.speechPauseInterval) {
      clearInterval(window.speechPauseInterval);
      window.speechPauseInterval = null;
    }
  }, []);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 15;
    const y = (clientY / innerHeight - 0.5) * -15;
    setMousePos({ x, y });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden" 
         style={{ background: 'linear-gradient(to bottom, var(--bg-base), var(--bg-surface))' }}
         onMouseMove={handleMouseMove}>
      
      {/* 1. Call Header */}
      <div className="absolute top-10 left-0 w-full flex flex-col items-center z-30">
        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-white text-xs font-medium tracking-wide uppercase">Secure Audio Call</span>
        </div>
        
        {/* Error Banner */}
        <AnimatePresence>
          {micError && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 bg-rose-500/20 border border-rose-500/30 backdrop-blur-md px-4 py-2 rounded-xl max-w-md mx-auto">
              <AlertCircle size={14} className="text-rose-400 shrink-0" />
              <p className="text-rose-300 text-xs font-medium">{micError}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. Pulsing Background Orbs */}
      <AnimatePresence>
        {(isSpeaking || isListening) && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.5, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
            style={{ background: isSpeaking ? 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)' }}
          />
        )}
      </AnimatePresence>

      {/* 3. The 3D Avatar (EmoCare Logo) */}
      <div className="relative z-20 flex flex-col items-center mb-8" style={{ perspective: 1000 }}>
        <motion.div
          animate={{
            y: isSpeaking ? [0, -4, 2, -2, 0] : [0, -8, 0],
            scale: isSpeaking ? [1, 1.01, 1] : [1, 1.03, 1],
            rotateX: mousePos.y,
            rotateY: mousePos.x,
            boxShadow: isSpeaking 
              ? ['0 0 0px rgba(16,185,129,0)', '0 0 80px rgba(16,185,129,0.5)', '0 0 0px rgba(16,185,129,0)']
              : isListening 
                ? ['0 0 0px rgba(56,189,248,0)', '0 0 60px rgba(56,189,248,0.3)', '0 0 0px rgba(56,189,248,0)']
                : '0 0 30px rgba(0,0,0,0.5)'
          }}
          transition={{
            y: { duration: isSpeaking ? 0.6 : 6, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: isSpeaking ? 0.6 : 5, repeat: Infinity, ease: "easeInOut" },
            boxShadow: { duration: isSpeaking ? 1.5 : 2.5, repeat: Infinity, ease: "easeInOut" },
            rotateX: { type: 'spring', stiffness: 70, damping: 30 },
            rotateY: { type: 'spring', stiffness: 70, damping: 30 }
          }}
          className="w-48 h-48 sm:w-64 sm:h-64 rounded-full overflow-hidden border-2 border-white/10 relative z-20 shadow-2xl bg-zinc-900"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <img src="/companion.png" alt="AI Companion" className="w-full h-full object-cover scale-110" />
        </motion.div>
      </div>

      {/* 4. Subtitles / Status */}
      <div className="relative z-30 min-h-[100px] px-8 max-w-2xl mx-auto w-full text-center flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div key="processing" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-indigo-400 drop-shadow-md" />
              <p className="text-zinc-400 font-medium">Processing...</p>
            </motion.div>
          ) : isSpeaking ? (
            <motion.div key="speaking" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} className="flex flex-col items-center gap-3">
              <Volume2 size={28} className="text-purple-400 animate-pulse drop-shadow-md" />
              <p className="text-purple-300 font-medium tracking-wide uppercase text-sm">Speaking</p>
              {messages.length > 0 && (
                <p className="text-zinc-300 text-sm md:text-base drop-shadow-lg line-clamp-3 max-w-xl mx-auto italic mt-1">
                  "{messages[messages.length-1].content}"
                </p>
              )}
            </motion.div>
          ) : isListening ? (
            <motion.div key="listening" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} className="flex flex-col items-center gap-3">
              <Mic size={28} className="text-sky-400 animate-bounce drop-shadow-md" />
              {transcript ? (
                <p className="text-white text-xl md:text-2xl font-medium drop-shadow-lg leading-relaxed max-w-xl mx-auto">
                  "{transcript}"
                </p>
              ) : (
                <p className="text-sky-300 font-medium tracking-wide uppercase text-sm">Listening...</p>
              )}
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} className="flex flex-col items-center gap-3">
              <p className="text-zinc-400 font-medium">Tap the microphone to speak</p>
              {messages.length > 0 && (
                <p className="text-zinc-300 text-lg md:text-xl drop-shadow-lg line-clamp-2 max-w-xl mx-auto italic">
                  "{messages[messages.length-1].content}"
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Call Controls Dock */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/80 backdrop-blur-2xl px-8 py-5 rounded-full border border-white/5 shadow-2xl flex items-center gap-8">
        
        {/* Mic Toggle */}
        <button 
          onClick={toggleListening}
          disabled={isProcessing}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isListening 
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/40 scale-110' 
              : 'bg-white/10 text-white hover:bg-white/20'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? <Mic size={28} /> : <MicOff size={28} />}
        </button>

        {/* Stop AI Speaking */}
        {isSpeaking && (
          <button 
            onClick={stopSpeaking}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/50"
          >
            <StopCircle size={24} />
          </button>
        )}

        {/* End Call */}
        <button 
          onClick={endCall}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/30"
        >
          <PhoneOff size={28} />
        </button>

      </div>
    </div>
  );
}
