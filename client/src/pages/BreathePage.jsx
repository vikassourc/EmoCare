import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Square, Wind, Play, RefreshCcw, Timer } from 'lucide-react';

const PATTERNS = {
  '478': {
    name: '4-7-8 Relaxation',
    Icon: Moon,
    desc: 'Calming technique for anxiety and sleep',
    phases: [
      { label: 'Inhale', duration: 4, scale: 1.4 },
      { label: 'Hold',   duration: 7, scale: 1.4 },
      { label: 'Exhale', duration: 8, scale: 1.0 },
    ],
  },
  box: {
    name: 'Box Breathing',
    Icon: Square,
    desc: 'Used by Navy SEALs for focus and calm',
    phases: [
      { label: 'Inhale', duration: 4, scale: 1.4 },
      { label: 'Hold',   duration: 4, scale: 1.4 },
      { label: 'Exhale', duration: 4, scale: 1.0 },
      { label: 'Hold',   duration: 4, scale: 1.0 },
    ],
  },
  deep: {
    name: 'Deep Breath',
    Icon: Wind,
    desc: 'Simple deep breathing for quick relief',
    phases: [
      { label: 'Inhale', duration: 5, scale: 1.4 },
      { label: 'Exhale', duration: 5, scale: 1.0 },
    ],
  },
};

const QUOTES = [
  { text: 'Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.', author: 'Thích Nhất Hạnh' },
  { text: 'Breath is the bridge which connects life to consciousness.', author: 'Thích Nhất Hạnh' },
  { text: 'Almost everything will work again if you unplug it for a few minutes, including you.', author: 'Anne Lamott' },
];

export default function BreathePage() {
  const [patternKey, setPatternKey] = useState('478');
  const [running, setRunning]       = useState(false);
  const [phase, setPhase]           = useState(0);
  const [countdown, setCountdown]   = useState(0);
  const [cycles, setCycles]         = useState(0);
  const [totalSec, setTotalSec]     = useState(0);

  const timerRef   = useRef(null);
  const totalRef   = useRef(null);
  const phaseRef   = useRef(0);
  const countRef   = useRef(0);

  const pattern = PATTERNS[patternKey];
  const currentPhase = pattern.phases[phase] || pattern.phases[0];

  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  useEffect(() => {
    if (!running) {
      clearInterval(timerRef.current);
      clearInterval(totalRef.current);
      return;
    }
    // Total time ticker
    totalRef.current = setInterval(() => setTotalSec(t => t + 1), 1000);

    // Phase ticker
    phaseRef.current = phase;
    countRef.current = pattern.phases[phase].duration;
    setCountdown(countRef.current);

    timerRef.current = setInterval(() => {
      countRef.current -= 1;
      setCountdown(countRef.current);

      if (countRef.current <= 0) {
        const nextPhase = (phaseRef.current + 1) % pattern.phases.length;
        phaseRef.current = nextPhase;
        setPhase(nextPhase);
        if (nextPhase === 0) setCycles(c => c + 1);
        countRef.current = pattern.phases[nextPhase].duration;
        setCountdown(countRef.current);
      }
    }, 1000);

    return () => { clearInterval(timerRef.current); clearInterval(totalRef.current); };
  }, [running, patternKey]);

  const toggle = () => {
    if (running) {
      setRunning(false);
      setPhase(0);
      setCountdown(0);
    } else {
      setPhase(0);
      setCountdown(pattern.phases[0].duration);
      setRunning(true);
    }
  };

  const selectPattern = (k) => {
    setRunning(false);
    setPatternKey(k);
    setPhase(0);
    setCountdown(0);
    setCycles(0);
    setTotalSec(0);
  };

  const quote = QUOTES[0];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Find Your Calm</h1>
        <p className="text-sm text-zinc-500 mt-1">Guided breathing exercises to center your mind and body.</p>
      </div>

      {/* Breathing circle */}
      <div className="flex flex-col items-center py-8 gap-6">
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <motion.div
            animate={{
              scale: running ? currentPhase.scale * 1.15 : 1,
              opacity: running ? 0.2 : 0.08,
            }}
            transition={{ duration: running ? currentPhase.duration : 0.5, ease: 'easeInOut' }}
            className="absolute w-56 h-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(52,199,150,0.4), transparent)' }}
          />
          {/* Main circle */}
          <motion.div
            animate={{ scale: running ? currentPhase.scale : 1 }}
            transition={{ duration: running ? currentPhase.duration : 0.5, ease: 'easeInOut' }}
            className="w-44 h-44 rounded-full flex flex-col items-center justify-center relative z-10"
            style={{
              background: 'linear-gradient(135deg, rgba(52,199,150,0.3), rgba(45,168,126,0.2))',
              border: '2px solid rgba(52,199,150,0.3)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 40px rgba(52,199,150,0.2), inset 0 0 30px rgba(45,168,126,0.1)',
            }}
          >
            <p className="text-lg font-semibold text-white">
              {running ? currentPhase.label : 'Ready'}
            </p>
            {running && (
              <p className="text-3xl font-bold text-[#34c796] mt-1">{countdown}</p>
            )}
          </motion.div>
        </div>

        {/* Start/Stop */}
        <motion.button
          onClick={toggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{
            background: running
              ? 'rgba(239,68,68,0.15)'
              : 'linear-gradient(135deg, #34c796, #2da87e)',
            border: running ? '1px solid rgba(239,68,68,0.3)' : 'none',
            color: running ? '#fca5a5' : '#050c0a',
            boxShadow: running ? 'none' : '0 4px 20px rgba(52,199,150,0.35)',
          }}
        >
          {running ? <><Square size={14} /> Stop</> : <><Play size={14} /> Begin Session</>}
        </motion.button>

        {/* Stats */}
        {(cycles > 0 || totalSec > 0) && (
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5"><RefreshCcw size={14}/> {cycles} cycles</span>
            <span className="w-px h-4 bg-white/10" />
            <span className="flex items-center gap-1.5"><Timer size={14}/> {fmt(totalSec)}</span>
          </div>
        )}
      </div>

      {/* Pattern cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(PATTERNS).map(([key, p]) => (
          <motion.button
            key={key}
            onClick={() => selectPattern(key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="p-4 rounded-2xl text-left transition-all"
            style={{
              background: patternKey === key ? 'rgba(52,199,150,0.12)' : 'rgba(18,18,22,0.7)',
              border: patternKey === key ? '1px solid rgba(52,199,150,0.3)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="mb-2" style={{ filter: patternKey === key ? 'none' : 'grayscale(100%)' }}>
              <div style={{ width:40, height:40, borderRadius:12, background:'rgba(52,199,150,0.12)', border:'1px solid rgba(52,199,150,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <p.Icon size={20} color='#34c796' strokeWidth={1.8} />
              </div>
            </div>
            <p className="text-sm font-semibold text-white">{p.name}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5 mb-3">{p.desc}</p>
            <div className="flex flex-wrap gap-1">
              {p.phases.map((ph, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-500">
                  {ph.label} {ph.duration}s
                </span>
              ))}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Quote */}
      <div className="text-center py-4">
        <p className="text-sm text-zinc-400 italic">"{quote.text}"</p>
        <p className="text-xs text-zinc-600 mt-2">— {quote.author}</p>
      </div>
    </div>
  );
}
