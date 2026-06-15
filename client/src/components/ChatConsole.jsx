import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Timer, Zap, Shield, CheckCheck, Clock, Brain } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import SecureInputZone from './SecureInputZone';
import EmergencyModal from './EmergencyModal';

/* ── Waveform Thinking Indicator ─────────────────────────────────── */
function WaveformLoader() {
  const bars = [0.4, 0.7, 1.0, 0.7, 0.4, 0.9, 0.6, 1.0, 0.5, 0.8];
  return (
    <div className="flex items-center gap-[3px] h-5 px-1">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-indigo-400/70"
          animate={{ scaleY: [h * 0.3, h, h * 0.3] }}
          transition={{
            duration: 1.0,
            repeat: Infinity,
            delay: i * 0.08,
            ease: 'easeInOut',
          }}
          style={{ height: 16, transformOrigin: 'center' }}
        />
      ))}
    </div>
  );
}

/* ── Single Message Bubble ────────────────────────────────────────── */
function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mb-1 shadow-md shadow-indigo-500/20">
          <span className="text-[10px] font-bold text-white">E</span>
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'text-white rounded-2xl rounded-br-sm'
              : 'text-zinc-200 rounded-2xl rounded-bl-sm'
          }`}
          style={
            isUser
              ? {
                  background: 'linear-gradient(135deg, #34c796, #2da87e)',
                  boxShadow: '0 4px 16px rgba(52,199,150,0.25)',
                }
              : {
                  background: 'rgba(38,38,42,0.7)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(12px)',
                }
          }
        >
          {message.status === 'thinking' ? (
            <WaveformLoader />
          ) : (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {message.content}
            </motion.span>
          )}
        </div>

        {/* Meta: timestamp + status */}
        <div className={`flex items-center gap-1.5 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-zinc-600">
            {new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isUser && (
            <span>
              {message.status === 'sending' && <Clock size={9} className="text-zinc-600" />}
              {message.status === 'delivered' && <CheckCheck size={9} className="text-indigo-400" />}
            </span>
          )}
        </div>

        {/* Insight pill */}
        <AnimatePresence>
          {message.insight && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 p-3 rounded-xl overflow-hidden"
              style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.15)',
                maxWidth: 320,
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Brain size={11} className="text-indigo-400" />
                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide">
                  Emotional Insight
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <span className="text-[10px] text-zinc-600 w-14">Emotion</span>
                  <span className="text-[10px] text-zinc-300 capitalize">{message.insight.emotion}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] text-zinc-600 w-14">Intensity</span>
                  <span className={`text-[10px] capitalize ${
                    message.insight.intensity === 'high' ? 'text-rose-400' :
                    message.insight.intensity === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{message.insight.intensity}</span>
                </div>
                {message.insight.possible_causes?.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-1">
                    {message.insight.possible_causes.slice(0, 3).map((c, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded-md text-zinc-400">{c}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Session Timer ────────────────────────────────────────────────── */
function SessionTimer({ startTs }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTs) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTs]);
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  return <span className="font-mono text-[11px] text-zinc-500">{m}:{s}</span>;
}

/* ── Parse Insight from AI text ───────────────────────────────────── */
function parseInsight(text) {
  if (!text?.includes('INSIGHT_START')) return { clean: text, insight: null };
  const [before, rest] = text.split('INSIGHT_START');
  if (!rest) return { clean: text, insight: null };
  const [raw] = rest.split('INSIGHT_END');
  const lines = {};
  raw.trim().split('\n').forEach(line => {
    const [k, ...v] = line.split(':');
    if (k && v.length) lines[k.trim()] = v.join(':').trim();
  });
  return {
    clean: before.trim(),
    insight: {
      emotion: lines['emotion'] || '',
      intensity: lines['intensity'] || '',
      possible_causes: (lines['possible_causes'] || '').split('|').map(s => s.trim()).filter(Boolean),
      recommendations: (lines['recommendations'] || '').split('|').map(s => s.trim()).filter(Boolean),
      reflection_question: lines['reflection_question'] || '',
    }
  };
}

/* ── Chat Console ─────────────────────────────────────────────────── */
export default function ChatConsole() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSessionId = searchParams.get('session');
  const isNewSessionRef = useRef(false);

  const [messages, setMessages]     = useState([
    {
      id: 0,
      role: 'ai',
      content: "Welcome to your safe space. 💚\n\nI'm EmoCare — your private emotional wellness companion. I'm here to listen without judgment, and to help you process whatever is on your mind today.\n\nHow are you feeling right now?",
      status: 'delivered',
      ts: Date.now() - 5000,
      insight: null,
    }
  ]);
  const [input, setInput]           = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [groundingMode, setGrounding] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [sessionId, setSessionId]   = useState(initialSessionId);
  const [sessionStart]              = useState(Date.now());
  const [token]                     = useState(() => localStorage.getItem('emocare_token'));

  const bottomRef   = useRef(null);
  const msgIdRef    = useRef(100);

  // Load existing session history if sessionId exists
  useEffect(() => {
    if (!initialSessionId) return;
    if (isNewSessionRef.current) {
      isNewSessionRef.current = false;
      return;
    }
    const loadSession = async () => {
      try {
        const data = await api.getSession(initialSessionId);
        if (data && data.session && data.session.messages) {
          const loadedMessages = data.session.messages.map((m, i) => ({
            id: i,
            role: m.role === 'assistant' ? 'ai' : 'user',
            content: m.content,
            status: 'delivered',
            ts: new Date(m.timestamp || data.session.updatedAt || Date.now()).getTime(),
            insight: m.insight || null,
          }));
          if (loadedMessages.length > 0) {
            setMessages(loadedMessages);
            msgIdRef.current = loadedMessages.length + 100;
          }
        }
      } catch (err) {
        console.error('Failed to load session history', err);
        setMessages([{
          id: 999, role: 'ai', content: `DEBUG ERROR: ${err.message}. SessionID was: ${initialSessionId}`, status: 'delivered', ts: Date.now(), insight: null
        }]);
      }
    };
    loadSession();
  }, [initialSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsgId = ++msgIdRef.current;
    const thinkingId = ++msgIdRef.current;

    // Optimistic user message
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      content: text,
      status: 'sending',
      ts: Date.now(),
      insight: null,
    }]);

    setIsLoading(true);

    // Optimistic thinking bubble
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: thinkingId,
        role: 'ai',
        content: '',
        status: 'thinking',
        ts: Date.now(),
        insight: null,
      }]);
    }, 300);

    // Mark user message as delivered
    setTimeout(() => {
      setMessages(prev => prev.map(m =>
        m.id === userMsgId ? { ...m, status: 'delivered' } : m
      ));
    }, 600);

    try {
      // Create session if needed
      let sid = sessionId;
      if (!sid) {
        const r = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ title: text.substring(0, 50) }),
        });
        if (r.ok) {
          const d = await r.json();
          sid = d.session?._id || d._id;
          isNewSessionRef.current = true;
          setSessionId(sid);
          setSearchParams({ session: sid }, { replace: true });
        }
      }

      // Send message
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessionId: sid, message: text }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');

      const { clean, insight } = parseInsight(data.response || '');

      // Replace thinking bubble with real response
      setMessages(prev => prev.map(m =>
        m.id === thinkingId
          ? { ...m, content: clean, status: 'delivered', insight }
          : m
      ));

    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === thinkingId
          ? { ...m, content: "I'm having a moment of difficulty connecting. Please try again — I'm here for you. 💚", status: 'delivered' }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, sessionId, token]);

  return (
    <>
      {/* Emergency Modal */}
      <AnimatePresence>
        {showEmergency && <EmergencyModal onClose={() => setShowEmergency(false)} />}
      </AnimatePresence>

      <div className="flex flex-col h-full">
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{
            background: 'rgba(14,14,16,0.7)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Left: Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative w-2 h-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-40" />
              </div>
              <span className="text-xs text-zinc-400">
                Online — <span className="text-emerald-500">here for you</span>
              </span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5 text-zinc-600">
              <Timer size={11} />
              <SessionTimer startTs={sessionStart} />
            </div>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            {/* Grounding toggle */}
            <motion.button
              onClick={() => setGrounding(g => !g)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                groundingMode
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-white/5 text-zinc-500 border border-white/5 hover:text-zinc-300'
              }`}
            >
              <Zap size={11} className={groundingMode ? 'text-indigo-400' : ''} />
              Grounding Mode
            </motion.button>

            {/* Emergency button */}
            <motion.button
              onClick={() => setShowEmergency(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200"
              style={{
                background: 'rgba(239,68,68,0.06)',
                borderColor: 'rgba(239,68,68,0.2)',
                color: 'rgba(252,165,165,0.8)',
                boxShadow: '0 0 12px rgba(239,68,68,0.05)',
              }}
            >
              <Shield size={11} />
              Crisis Support
            </motion.button>
          </div>
        </div>

        {/* ── Grounding mode banner ── */}
        <AnimatePresence>
          {groundingMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 py-3 text-center text-xs text-indigo-300 bg-indigo-500/8 border-b border-indigo-500/10">
                🌿 Grounding Mode — Take a slow breath. Inhale for 4 counts… hold… exhale for 4 counts.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Messages Area ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <SecureInputZone
          value={input}
          onChange={setInput}
          onSend={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
