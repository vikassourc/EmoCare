import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Sparkles, BookOpen, Loader2, ChevronDown, Smile, Frown, Activity, Flame, Wind, Brain, MessageCircle } from 'lucide-react';
import { api } from '../api';

const FALLBACK_PROMPTS = [
  "What is one emotion you've been avoiding lately, and what do you think it's trying to tell you?",
  "Describe a moment this week when you felt truly at peace. What made it possible?",
  "What belief about yourself do you wish you could let go of?",
  "If your anxiety could speak, what would it say? What would you reply?",
  "What does 'taking care of yourself' mean to you right now?",
  "Who in your life makes you feel truly seen? How do they do it?",
  "What would you tell your younger self about this phase of life?",
  "Write about a challenge you overcame. What did it teach you?",
  "What are you most proud of this week — no matter how small?",
  "What kind of person do you want to become in the next year?",
];

export default function JournalPage() {
  const [entries, setEntries]     = useState([]);
  const [text, setText]           = useState('');
  const [prompt, setPrompt]       = useState('');
  const [mood, setMood]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const [feedback, setFeedback]   = useState({});
  const [feedbackLoading, setFeedbackLoading] = useState({});
  const [expanded, setExpanded]   = useState(null);

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await api.getEntries();
      setEntries(data.entries || data || []);
    } catch {} finally { setLoading(false); }
  };

  const getPrompt = async () => {
    setPromptLoading(true);
    try {
      const data = await api.getPrompt();
      setPrompt(data.prompt || data.data || FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)]);
    } catch {
      setPrompt(FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)]);
    } finally { setPromptLoading(false); }
  };

  const save = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const data = await api.createEntry({ text: text.trim(), mood, wordCount: text.trim().split(/\s+/).length });
      setEntries(e => [data.entry || data, ...e]);
      setText(''); setMood(''); setPrompt('');
    } catch {} finally { setSaving(false); }
  };

  const remove = async (id) => {
    try {
      await api.deleteEntry(id);
      setEntries(e => e.filter(x => (x._id || x.id) !== id));
    } catch {}
  };

  const getFeedback = async (id) => {
    setFeedbackLoading(f => ({ ...f, [id]: true }));
    try {
      const data = await api.getFeedback(id);
      setFeedback(f => ({ ...f, [id]: data.aiFeedback || data.feedback || data.data }));
    } catch {} finally { setFeedbackLoading(f => ({ ...f, [id]: false })); }
  };

  const MOODS = [
    { name:'Happy', Icon:Smile },
    { name:'Sad', Icon:Frown },
    { name:'Anxious', Icon:Activity },
    { name:'Stressed', Icon:Flame },
    { name:'Calm', Icon:Wind },
    { name:'Reflective', Icon:Brain }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Journal</h1>
        <p className="text-sm text-zinc-500 mt-1">A safe space to process your thoughts and feelings.</p>
      </div>

      {/* Write Area */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        className="rounded-2xl p-5 space-y-4"
        style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>

        {/* Prompt */}
        <AnimatePresence>
          {prompt && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
              className="p-3 rounded-xl text-sm text-zinc-300 italic flex items-start gap-2"
              style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.15)' }}>
              <MessageCircle size={14} className="flex-shrink-0 mt-0.5 text-indigo-400" />
              <span>{prompt}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="What's on your mind today? Write freely — this is your private space…"
          rows={6}
          className="w-full bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none leading-relaxed resize-none"
        />

        {/* Mood picker */}
        <div className="flex flex-wrap gap-2">
          {MOODS.map(m => (
            <button key={m.name} onClick={() => setMood(mood === m.name ? '' : m.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border ${
                mood === m.name
                  ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                  : 'bg-white/5 border-white/5 text-zinc-500 hover:text-zinc-300'
              }`}>
              <m.Icon size={12} /> {m.name}
            </button>
          ))}
        </div>

        {/* Word count */}
        {text && (
          <p className="text-[11px] text-zinc-600">
            {text.trim().split(/\s+/).filter(Boolean).length} words
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={getPrompt} disabled={promptLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors border border-white/5 bg-white/5">
            {promptLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            AI Prompt
          </button>
          <motion.button onClick={save} disabled={saving || !text.trim()}
            whileHover={text.trim() ? { scale:1.02 } : {}} whileTap={text.trim() ? { scale:0.97 } : {}}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white ml-auto"
            style={{
              background: text.trim() ? 'linear-gradient(135deg,#6366f1,#7c3aed)' : 'rgba(255,255,255,0.05)',
              boxShadow: text.trim() ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
              color: text.trim() ? 'white' : '#52525b',
            }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Save Entry
          </motion.button>
        </div>
      </motion.div>

      {/* Entries */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} className="text-zinc-500" />
          <p className="text-sm font-medium text-zinc-400">Past Entries ({entries.length})</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 p-6 text-zinc-600 text-sm">
            <Loader2 size={16} className="animate-spin" /> Loading entries…
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-zinc-600">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No entries yet. Write your first one above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {entries.map((entry, i) => {
                const id = entry._id || entry.id;
                const isOpen = expanded === id;
                return (
                  <motion.div key={id} layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl overflow-hidden"
                    style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <button className="w-full flex items-start gap-3 p-4 text-left"
                      onClick={() => setExpanded(isOpen ? null : id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {entry.mood && <span className="text-xs bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{entry.mood.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/gu, '').trim()}</span>}
                          <span className="text-[11px] text-zinc-600">
                            {new Date(entry.createdAt).toLocaleDateString('en-IN', { weekday:'short', month:'short', day:'numeric' })}
                          </span>
                          {entry.wordCount && (
                            <span className="text-[10px] text-zinc-700">{entry.wordCount} words</span>
                          )}
                        </div>
                        <p className={`text-sm text-zinc-300 ${isOpen ? '' : 'line-clamp-2'}`}>{entry.text}</p>
                      </div>
                      <ChevronDown size={14} className={`text-zinc-600 flex-shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }}
                          className="overflow-hidden border-t border-white/5">
                          <div className="p-4 space-y-3">
                            {/* AI Feedback */}
                            {feedback[id] ? (
                              <div className="p-3 rounded-xl text-xs text-zinc-300 leading-relaxed"
                                style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.15)' }}>
                                <p className="text-indigo-400 font-medium mb-1 flex items-center gap-1.5"><Sparkles size={12} /> EmoCare Reflection</p>
                                {feedback[id]}
                              </div>
                            ) : (
                              <button onClick={() => getFeedback(id)} disabled={feedbackLoading[id]}
                                className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                                {feedbackLoading[id] ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                                Get AI reflection on this entry
                              </button>
                            )}
                            <div className="flex justify-end">
                              <button onClick={() => remove(id)}
                                className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-rose-400 transition-colors">
                                <Trash2 size={11} /> Delete
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
