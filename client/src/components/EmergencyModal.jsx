import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Heart, AlertTriangle, ExternalLink } from 'lucide-react';

const RESOURCES = [
  {
    name: 'iCall',
    number: '9152987821',
    desc: 'Psychosocial helpline by TISS — available Mon–Sat, 8am–10pm',
    color: 'from-rose-500/20 to-red-500/10',
    border: 'border-rose-500/20',
  },
  {
    name: 'Vandrevala Foundation',
    number: '1860-2662-345',
    desc: '24/7 mental health helpline — free, confidential support',
    color: 'from-violet-500/20 to-indigo-500/10',
    border: 'border-violet-500/20',
  },
  {
    name: 'iCall Text Support',
    number: 'icall@tiss.edu',
    desc: 'Email counseling for those who prefer written expression',
    color: 'from-sky-500/20 to-blue-500/10',
    border: 'border-sky-500/20',
  },
];

export default function EmergencyModal({ onClose }) {
  const [copied, setCopied] = useState(null);

  const copy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(18,18,20,0.95)',
          border: '1px solid rgba(239,68,68,0.2)',
          boxShadow: '0 0 60px rgba(239,68,68,0.1), 0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
              <Heart size={16} className="text-rose-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">You're Not Alone</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Immediate support is available right now</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Message */}
        <div className="px-5 pt-4 pb-2">
          <div className="p-3 rounded-xl bg-rose-500/8 border border-rose-500/15 text-xs text-zinc-300 leading-relaxed">
            💚 If you're in crisis or feeling unsafe, please reach out to one of these trusted helplines. Trained counselors are ready to listen — no judgment, completely confidential.
          </div>
        </div>

        {/* Resources */}
        <div className="p-4 space-y-3">
          {RESOURCES.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`p-3.5 rounded-xl bg-gradient-to-br ${r.color} border ${r.border}`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-white">{r.name}</p>
                <button
                  onClick={() => copy(r.number, i)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {copied === i ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <Phone size={11} className="text-zinc-400" />
                <span className="text-sm font-mono font-medium text-zinc-200">{r.number}</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">{r.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/8 transition-colors border border-white/5"
          >
            Close — I'm safe right now
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
