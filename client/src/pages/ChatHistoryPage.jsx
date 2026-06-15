import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Trash2, ChevronRight, Clock, TrendingUp, TrendingDown, Minus, Plus, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

const MOOD_ICONS = { positive: TrendingUp, neutral: Minus, negative: TrendingDown };
const MOOD_COLORS = { positive: 'text-emerald-400', neutral: 'text-zinc-400', negative: 'text-rose-400' };
const MOOD_BG = { positive: 'bg-emerald-500/10 border-emerald-500/20', neutral: 'bg-zinc-500/10 border-zinc-500/20', negative: 'bg-rose-500/10 border-rose-500/20' };

function getMoodValence(messages = []) {
  if (!messages.length) return 'neutral';
  const last = messages[messages.length - 1];
  const text = (last?.insight?.emotion || last?.content || '').toLowerCase();
  if (['happy','calm','grateful','hopeful','excited','joy','relief'].some(w => text.includes(w))) return 'positive';
  if (['sad','anxious','angry','stress','lonely','depress','overwhelm','grief','numb'].some(w => text.includes(w))) return 'negative';
  return 'neutral';
}

export default function ChatHistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await api.getSessions();
      setSessions(data.sessions || data || []);
    } catch {} finally { setLoading(false); }
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await api.deleteSession(id);
      setSessions(s => s.filter(x => (x._id || x.id) !== id));
    } catch {} finally { setDeleting(null); }
  };

  const openSession = (id) => navigate(`/chat?session=${id}`);

  const grouped = sessions.reduce((acc, s) => {
    const d = new Date(s.updatedAt || s.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    const key = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : diffDays < 7 ? 'This Week' : 'Older';
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

  const GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Older'];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Chat History</h1>
          <p className="text-sm text-zinc-500 mt-1">{sessions.length} conversations · tap to resume</p>
        </div>
        <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          onClick={() => navigate('/chat')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background:'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow:'0 4px 16px rgba(99,102,241,0.3)' }}>
          <Plus size={14} /> New Chat
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 p-8 justify-center text-zinc-600">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading conversations…</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle size={40} className="mx-auto mb-4 text-zinc-700" />
          <p className="text-zinc-500 text-sm">No conversations yet.</p>
          <button onClick={() => navigate('/chat')}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-medium text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/10 transition-colors">
            Start your first session →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {GROUP_ORDER.filter(g => grouped[g]).map(group => (
            <div key={group}>
              <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">{group}</p>
              <div className="space-y-2">
                {grouped[group].map((session, i) => {
                  const id = session._id || session.id;
                  const valence = getMoodValence(session.messages);
                  const MoodIcon = MOOD_ICONS[valence];
                  const msgCount = session.messages?.length || session.messageCount || 0;
                  return (
                    <motion.div key={id} layout
                      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => openSession(id)}
                      className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer group transition-all hover:bg-white/5"
                      style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
                      {/* Mood icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${MOOD_BG[valence]}`}>
                        <MoodIcon size={16} className={MOOD_COLORS[valence]} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">
                          {session.title || 'Untitled Session'}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-zinc-600 flex items-center gap-1">
                            <Clock size={10} />
                            {new Date(session.updatedAt || session.createdAt).toLocaleString('en-IN', {
                              month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
                            })}
                          </span>
                          {msgCount > 0 && (
                            <span className="text-[11px] text-zinc-700">{msgCount} messages</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
                          onClick={(e) => deleteSession(id, e)}
                          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                          {deleting === id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </motion.button>
                        <ChevronRight size={14} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
