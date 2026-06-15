import { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff } from 'lucide-react';

export default function SecureInputZone({ value, onChange, onSend, isLoading, charLimit = 1000 }) {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [value]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSend();
    }
  }, [isLoading, value, onSend]);

  const canSend = value.trim().length > 0 && !isLoading;
  const charPct = value.length / charLimit;
  const charColor = charPct > 0.9 ? 'text-rose-400' : charPct > 0.7 ? 'text-amber-400' : 'text-zinc-600';

  return (
    <div className="px-4 pb-4 pt-2">
      <motion.div
        layout
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(28,28,32,0.9)',
          border: canSend
            ? '1px solid rgba(99,102,241,0.35)'
            : '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
          boxShadow: canSend
            ? '0 0 0 1px rgba(99,102,241,0.1), 0 8px 32px rgba(0,0,0,0.4)'
            : '0 8px 32px rgba(0,0,0,0.3)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value.slice(0, charLimit))}
          onKeyDown={handleKey}
          placeholder="Share what's on your mind…"
          rows={1}
          className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 px-4 pt-4 pb-12 resize-none leading-relaxed focus:outline-none"
          style={{ minHeight: 56, maxHeight: 160 }}
        />

        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-2">
            {/* Voice button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-colors"
            >
              <Mic size={14} />
            </motion.button>

            {/* Char counter */}
            <AnimatePresence>
              {value.length > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`text-[10px] font-mono transition-colors ${charColor}`}
                >
                  {value.length}/{charLimit}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Send button */}
          <motion.button
            onClick={onSend}
            disabled={!canSend}
            whileHover={canSend ? { scale: 1.08 } : {}}
            whileTap={canSend ? { scale: 0.92 } : {}}
            animate={{
              background: canSend
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'rgba(255,255,255,0.05)',
              boxShadow: canSend
                ? '0 4px 16px rgba(16,185,129,0.35)'
                : 'none',
            }}
            transition={{ duration: 0.25 }}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-3.5 h-3.5 border border-zinc-600 border-t-zinc-300 rounded-full"
              />
            ) : (
              <Send size={13} className={canSend ? 'text-white' : 'text-zinc-600'} />
            )}
          </motion.button>
        </div>
      </motion.div>

      <p className="text-center text-[10px] text-zinc-700 mt-2">
        EmoCare AI · Private & Confidential · Press <kbd className="px-1 py-0.5 bg-white/5 rounded text-zinc-600 text-[9px]">⏎</kbd> to send
      </p>
    </div>
  );
}
