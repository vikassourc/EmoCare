import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, BookOpen, BarChart2, Wind,
  Plus, ChevronLeft, ChevronRight, MoreHorizontal,
  TrendingUp, TrendingDown, Minus, Wifi
} from 'lucide-react';

const NAV_ITEMS = [
  { icon: MessageCircle, label: 'Chat',       id: 'chat'      },
  { icon: BookOpen,      label: 'Journal',    id: 'journal'   },
  { icon: BarChart2,     label: 'Insights',   id: 'insights'  },
  { icon: Wind,          label: 'Breathe',    id: 'breathe'   },
];

const MOOD_ICONS = {
  positive: TrendingUp,
  neutral:  Minus,
  negative: TrendingDown,
};

const SESSIONS = [
  { id: 1, title: 'Feeling overwhelmed with work',     mood: 'negative', group: 'Today'     },
  { id: 2, title: 'Processing the breakup emotions',   mood: 'negative', group: 'Today'     },
  { id: 3, title: 'Small wins, feeling hopeful',        mood: 'positive', group: 'Yesterday' },
  { id: 4, title: 'Anxiety about upcoming exams',      mood: 'negative', group: 'Yesterday' },
  { id: 5, title: 'Gratitude and self-reflection',     mood: 'positive', group: 'Yesterday' },
];

const MOOD_COLORS = {
  positive: 'text-emerald-400',
  neutral:  'text-zinc-400',
  negative: 'text-rose-400',
};

export default function NavigationSidebar({ collapsed, onToggle, activeView, setActiveView, onNewSession }) {
  const [hoveredSession, setHoveredSession] = useState(null);

  const grouped = SESSIONS.reduce((acc, s) => {
    (acc[s.group] = acc[s.group] || []).push(s);
    return acc;
  }, {});

  return (
    <motion.aside
      layout
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative z-20 flex flex-col h-full overflow-hidden"
      style={{
        background: 'rgba(18, 18, 20, 0.85)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
          <span className="text-white text-xs font-bold">E</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1,  x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-semibold text-sm text-white leading-none">EmoCare</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">AI Wellness</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── New Session Button ── */}
      <div className="px-3 py-3">
        <motion.button
          onClick={onNewSession}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
            border: '1px solid rgba(99,102,241,0.3)',
          }}
        >
          {/* Shimmer on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.15), transparent)',
              backgroundSize: '200% auto',
              animation: 'shimmer-move 1.5s linear infinite',
            }}
          />
          <Plus size={15} className="flex-shrink-0 text-indigo-400" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs"
              >
                Initiate Safe-Space Session
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Nav Items ── */}
      <div className="px-3 space-y-1">
        {NAV_ITEMS.map(({ icon: Icon, label, id }) => (
          <motion.button
            key={id}
            onClick={() => setActiveView(id)}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 relative group ${
              activeView === id
                ? 'bg-white/10 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            {activeView === id && (
              <motion.div
                layoutId="nav-active"
                className="absolute inset-0 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <Icon size={16} className="flex-shrink-0 relative z-10" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative z-10 text-xs font-medium"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
            {/* Tooltip when collapsed */}
            {collapsed && (
              <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-zinc-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 border border-white/10">
                {label}
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* ── Session History ── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 overflow-y-auto px-3 mt-4 space-y-4"
          >
            {Object.entries(grouped).map(([group, sessions]) => (
              <div key={group}>
                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-2 px-1">
                  {group}
                </p>
                <div className="space-y-1">
                  {sessions.map((session) => {
                    const MoodIcon = MOOD_ICONS[session.mood];
                    return (
                      <motion.div
                        key={session.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        onMouseEnter={() => setHoveredSession(session.id)}
                        onMouseLeave={() => setHoveredSession(null)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer group hover:bg-white/5 transition-colors"
                      >
                        <MoodIcon size={11} className={`flex-shrink-0 ${MOOD_COLORS[session.mood]}`} />
                        <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors truncate flex-1">
                          {session.title}
                        </span>
                        <AnimatePresence>
                          {hoveredSession === session.id && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="p-0.5 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
                            >
                              <MoreHorizontal size={12} />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Midnight Focus Toggle ── */}
      <div className="px-3 pb-3 mt-auto">
        <button
          onClick={() => window.handleDarkToggle && window.handleDarkToggle()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 transition-colors"
          style={{ background: 'rgba(99,102,241,0.05)' }}
        >
          <span>🚀</span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                Midnight Focus
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* ── User Capsule ── */}
      <div className="border-t border-white/5 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-semibold text-white">
              U
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-zinc-900 relative pulse-dot" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1,  x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-medium text-zinc-200 truncate">You</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Wifi size={9} className="text-emerald-500" />
                  <p className="text-[10px] text-zinc-500">Synced with EmoCare Cloud</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Collapse Toggle ── */}
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white z-30"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </motion.button>
    </motion.aside>
  );
}
