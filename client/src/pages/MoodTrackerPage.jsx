import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Loader2, BarChart2, Activity, TrendingUp, Calendar, Music, Smile, Frown, AlertCircle, Flame, Wind, Minus, AlertOctagon, Zap, HeartHandshake, UserMinus, CloudLightning, Star, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { useTheme } from '../context/ThemeContext';

const EMOTIONS = [
  { name:'Happy',       Icon:Smile, color:'#34c796', bg:'rgba(52,199,150,0.15)',  border:'rgba(52,199,150,0.3)'  },
  { name:'Sad',         Icon:Frown, color:'#34c796', bg:'rgba(52,199,150,0.15)',  border:'rgba(52,199,150,0.3)'  },
  { name:'Anxious',     Icon:AlertCircle, color:'#34c796', bg:'rgba(52,199,150,0.15)',  border:'rgba(52,199,150,0.3)'  },
  { name:'Stressed',    Icon:Flame, color:'#34c796', bg:'rgba(52,199,150,0.15)',   border:'rgba(52,199,150,0.3)'   },
  { name:'Calm',        Icon:Wind, color:'#34c796', bg:'rgba(52,199,150,0.15)',  border:'rgba(52,199,150,0.3)'  },
  { name:'Numb',        Icon:Minus, color:'#34c796', bg:'rgba(52,199,150,0.15)', border:'rgba(52,199,150,0.3)'  },
  { name:'Angry',       Icon:AlertOctagon, color:'#34c796', bg:'rgba(52,199,150,0.15)', border:'rgba(52,199,150,0.3)'  },
  { name:'Excited',     Icon:Zap, color:'#34c796', bg:'rgba(52,199,150,0.15)', border:'rgba(52,199,150,0.3)'  },
  { name:'Grateful',    Icon:HeartHandshake, color:'#34c796', bg:'rgba(52,199,150,0.15)', border:'rgba(52,199,150,0.3)'  },
  { name:'Lonely',      Icon:UserMinus, color:'#34c796', bg:'rgba(52,199,150,0.15)',border:'rgba(52,199,150,0.3)' },
  { name:'Overwhelmed', Icon:CloudLightning, color:'#34c796', bg:'rgba(52,199,150,0.15)',border:'rgba(52,199,150,0.3)' },
  { name:'Hopeful',     Icon:Star, color:'#34c796', bg:'rgba(52,199,150,0.15)', border:'rgba(52,199,150,0.3)'  },
];

const INTENSITY_MAP = (s) => s <= 3 ? 'low' : s <= 6 ? 'medium' : 'high';
const INTENSITY_COLOR = { low:'text-[#34c796] bg-emerald-500/5', medium:'text-[#34c796] bg-emerald-500/10', high:'text-[#34c796] bg-emerald-500/20' };

export default function MoodTrackerPage() {
  const { setTheme } = useTheme();
  const [selected, setSelected] = useState(null);
  const [score, setScore]       = useState(5);
  const [note, setNote]         = useState('');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [history, setHistory]   = useState([]);
  const [loadingH, setLoadingH] = useState(true);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    setLoadingH(true);
    try {
      // Use the proper api method or fetch with correct error handling
      const data = await api.getMoods ? await api.getMoods() : await fetch('/api/mood', {
        headers: { Authorization: `Bearer ${localStorage.getItem('emocare_token')}` }
      }).then(r => r.json());
      setHistory((data?.entries || data?.moods || data || []).slice(0, 30));
    } catch (err) {
      console.error('Failed to load mood history', err);
    } finally { setLoadingH(false); }
  };

  const getThemeForMood = (emotion) => {
    const e = emotion.toLowerCase();
    if (['happy', 'excited', 'hopeful', 'angry'].includes(e)) return 'sunset';
    if (['calm', 'grateful', 'relaxed'].includes(e)) return 'forest';
    if (['sad', 'lonely', 'numb'].includes(e)) return 'ocean';
    return 'zinc';
  };

  const logMood = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const emName = selected.name.toLowerCase();
      
      const payload = {
        emotion: emName,
        intensity: INTENSITY_MAP(score),
        score,
        causes: note.trim() ? [note.trim()] : [],
        source: 'manual',
      };
      
      if (api.createMood) {
        await api.createMood(payload);
      } else {
        const res = await fetch('/api/mood', {
          method: 'POST',
          headers: { 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('emocare_token')}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to save mood');
      }
      
      setSaved(true);
      setNote('');
      setTheme(getThemeForMood(emName)); // Auto-switch theme based on mood!
      setTimeout(() => setSaved(false), 2500);
      loadHistory();
    } catch (err) {
      console.error('Failed to save mood', err);
      alert('Failed to save mood. Please try again.');
    } finally { setSaving(false); }
  };

  const sliderColor = '#34c796';

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Mood Tracker</h1>
        <p className="text-sm text-zinc-500 mt-1">Log how you're feeling right now.</p>
      </div>

      {/* Emotion Wheel Grid */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        className="rounded-2xl p-5"
        style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-sm font-medium text-zinc-300 mb-4">How are you feeling?</p>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {EMOTIONS.map(em => (
            <motion.button key={em.name}
              onClick={() => setSelected(selected?.name === em.name ? null : em)}
              whileHover={{ scale:1.08 }} whileTap={{ scale:0.92 }}
              animate={{ scale: selected?.name === em.name ? 1.1 : 1 }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all border"
              style={{
                background: selected?.name === em.name ? em.bg : 'rgba(255,255,255,0.03)',
                borderColor: selected?.name === em.name ? em.border : 'rgba(255,255,255,0.05)',
                boxShadow: selected?.name === em.name ? `0 0 20px ${em.color}30` : 'none',
              }}>
              <span><em.Icon size={24} style={{ color: selected?.name === em.name ? em.color : 'rgba(255,255,255,0.7)' }} strokeWidth={selected?.name === em.name ? 2 : 1.5} /></span>
              <span className="text-[10px] font-medium text-zinc-400" style={{ color: selected?.name === em.name ? em.color : '' }}>
                {em.name}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Intensity + Note */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            className="overflow-hidden space-y-4">
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
              {/* Intensity slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium text-zinc-300">Intensity</p>
                  <span className="text-sm font-bold" style={{ color: sliderColor }}>{score}/10</span>
                </div>
                <input type="range" min={1} max={10} value={score} onChange={e => setScore(+e.target.value)}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{ background:`linear-gradient(to right, ${sliderColor} ${score*10}%, rgba(255,255,255,0.1) ${score*10}%)` }} />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-zinc-600">Barely noticeable</span>
                  <span className="text-[10px] text-zinc-600">Overwhelming</span>
                </div>
              </div>

              {/* Note */}
              <div>
                <p className="text-sm font-medium text-zinc-300 mb-2">Add a note <span className="text-zinc-600">(optional)</span></p>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                  placeholder="What's contributing to this feeling?"
                  className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none resize-none" />
              </div>

              <motion.button onClick={logMood} disabled={saving}
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{
                  background: saved ? 'rgba(52,199,150,0.2)' : `linear-gradient(135deg, #34c796, #2da87e)`,
                  border: `1px solid rgba(52,199,150,0.3)`,
                  color: saved ? '#34c796' : '#050c0a',
                }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <><CheckCircle2 size={14} /> Mood Logged!</> : <>
                  <selected.Icon size={16} /> Log "{selected.name}" Mood
                </>}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood History */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-zinc-500" />
          <p className="text-sm font-medium text-zinc-400">Recent Moods</p>
        </div>

        {loadingH ? (
          <div className="flex items-center gap-3 p-6 justify-center text-zinc-600">
            <Loader2 size={16} className="animate-spin" /><span className="text-sm">Loading…</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-zinc-600">
            <Heart size={28} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No moods logged yet. Log your first above!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((entry, i) => {
              const em = EMOTIONS.find(e => e.name.toLowerCase() === entry.emotion) || EMOTIONS[0];
              const intColor = INTENSITY_COLOR[entry.intensity] || INTENSITY_COLOR.medium;
              return (
                <motion.div key={entry._id || i} layout initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background:'rgba(18,18,22,0.6)', border:'1px solid rgba(255,255,255,0.05)', borderLeft:`3px solid ${em.color}` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ background: em.bg, borderColor: em.border }}><em.Icon size={16} color={em.color} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-200 capitalize">{entry.emotion}</p>
                    {entry.causes?.[0] && <p className="text-[11px] text-zinc-600 truncate">{entry.causes[0]}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.score && <span className="text-xs font-bold text-zinc-400">{entry.score}/10</span>}
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${intColor}`}>
                      {entry.intensity}
                    </span>
                    <span className="text-[10px] text-zinc-700">
                      {new Date(entry.createdAt).toLocaleDateString('en-IN', { month:'short', day:'numeric' })}
                    </span>
                    <a href={`https://music.youtube.com/search?q=${encodeURIComponent(entry.emotion + ' mood playlist')}`} target="_blank" rel="noopener noreferrer" 
                       className="ml-2 p-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-[#34c796] transition-colors border border-emerald-500/20" 
                       title={`Listen to ${entry.emotion} music on YouTube Music`}>
                      <Music size={12} />
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
