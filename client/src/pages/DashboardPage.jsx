import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, MessageCircle, BookOpen, TrendingUp, Flame, Sparkles, ChevronRight, Smile, Frown, Wind, Music, PenLine, Activity, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MoodIcon, StatIcon } from '../components/PremiumIcon';
import MoodChart from '../components/MoodChart';

const MOODS = ['Happy','Sad','Anxious','Stressed','Calm','Numb'];
const MOOD_EMOJIS  = { Happy:'😊', Sad:'😢', Anxious:'😰', Stressed:'😤', Calm:'😌', Numb:'😶' };
const MOOD_COLORS  = { Happy:'#34c796', Sad:'#38bdf8', Anxious:'#f59e0b', Stressed:'#ef4444', Calm:'#a78bfa', Numb:'#94a3b8' };
const MOOD_ICONS   = { Happy: Smile, Sad: Frown, Anxious: Activity, Stressed: Flame, Calm: Wind, Numb: Sparkles };
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]   = useState(null);
  const [chart, setChart]   = useState([]);
  const [recs, setRecs]     = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodLogged, setMoodLogged] = useState(false);
  const [musicModal, setMusicModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, c, r, t] = await Promise.allSettled([
          api.getDashStats(), api.getMoodChart(), api.getRecommendations(), api.getTriggers()
        ]);
        if (s.status === 'fulfilled') setStats(s.value.stats || s.value);
        if (c.status === 'fulfilled') setChart(c.value.chartData || c.value.moodData || c.value.data || []);
        if (r.status === 'fulfilled') setRecs(r.value.recommendations || []);
        if (t.status === 'fulfilled') setTriggers(t.value.triggers || []);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const logMood = async (mood) => {
    setSelectedMood(mood);
    try {
      await api.createMood({ emotion: mood.toLowerCase(), intensity: 'medium', score: 5, source: 'manual' });
      setMoodLogged(true);
      setTimeout(() => setMoodLogged(false), 3000);
    } catch {}
  };

  const statCards = [
    { label: 'Sessions This Week', value: stats?.sessionsThisWeek ?? '—', icon: MessageCircle, color: '#34c796' },
    { label: 'Avg Mood Score',     value: stats?.avgMoodScore ? `${stats.avgMoodScore.toFixed(1)}/10` : '—', icon: TrendingUp, color: '#38bdf8' },
    { label: 'Day Streak',         value: stats?.dayStreak ? `${stats.dayStreak} days` : '—', icon: Flame,         color: '#fb923c' },
    { label: 'Journal Entries',    value: stats?.journalEntries ?? '—', icon: BookOpen,        color: '#a78bfa' },
  ];

  const maxScore = Math.max(...chart.map(d => d.avgScore || 0), 1);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Greeting */}
      <div>
        <motion.h1 initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
          className="text-2xl font-semibold text-white">
          Good {getTimeOfDay()}, {user?.name?.split(' ')[0] || 'there'}
        </motion.h1>
        <p className="text-sm text-zinc-500 mt-1">Here's how your wellness journey is going.</p>
      </div>

      {/* Mood Check-in */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
        className="rounded-2xl p-5"
        style={{ background:'rgba(52,199,150,0.07)', border:'1px solid rgba(52,199,150,0.15)' }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(232,245,240,0.7)', marginBottom: 12, display:'flex', alignItems:'center', gap:6 }}>
          {moodLogged
            ? <><CheckCircle2 size={15} color='#34c796'/> Mood logged! Keep checking in daily.</>
            : <><Sparkles size={14} color='#34c796'/> How are you feeling right now?</>}
        </p>
        <div className="flex flex-wrap gap-3">
          {MOODS.map(mood => (
            <motion.button key={mood} whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.92 }}
              onClick={() => logMood(mood)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px 8px 10px',
                borderRadius: 100,
                border: `1.5px solid ${selectedMood === mood ? MOOD_COLORS[mood] : `${MOOD_COLORS[mood]}30`}`,
                background: selectedMood === mood ? `${MOOD_COLORS[mood]}20` : 'rgba(52,199,150,0.04)',
                boxShadow: selectedMood === mood ? `0 0 16px ${MOOD_COLORS[mood]}40` : 'none',
                transition: 'all 0.2s', cursor: 'pointer',
              }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: `${MOOD_COLORS[mood]}25`, border: `1px solid ${MOOD_COLORS[mood]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(() => { const MIcon = MOOD_ICONS[mood]; return <MIcon size={14} color={MOOD_COLORS[mood]} strokeWidth={2} />; })()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: selectedMood === mood ? '#e8f5f0' : 'rgba(232,245,240,0.5)' }}>{mood}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={label} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            style={{ background: 'rgba(13,31,26,0.7)', border: '1px solid rgba(52,199,150,0.12)', borderRadius: 20, padding: 24 }}>
            <StatIcon icon={Icon} color={color} size={16} boxSize={38} />
            <p style={{ fontSize: 28, fontWeight: 700, color: '#e8f5f0', margin: '12px 0 4px', fontFamily: 'Georgia, serif' }}>{loading ? '…' : value}</p>
            <p style={{ fontSize: 11, color: 'rgba(232,245,240,0.38)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Two-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Mood Chart */}
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="h-full flex flex-col">
            <MoodChart data={chart} />
          </motion.div>

        {/* Recommendations */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
          className="rounded-2xl p-5"
          style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} style={{ color: '#34c796' }} />
            <p className="text-sm font-semibold text-white">AI Recommendations</p>
          </div>
          {recs.length === 0 ? (
            <div className="space-y-2">
              {['Chat with EmoCare AI to get personalized tips', 'Try 5 minutes of breathing exercises today', 'Write in your journal to process your feelings'].map((r,i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                  <span style={{ color: '#34c796' }} className="mt-0.5">•</span>{r}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {recs.slice(0,4).map((r,i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                  <div className="flex flex-col">
                    <span className="text-zinc-200 font-medium mb-1 flex items-center gap-2"><div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:20, height:20, borderRadius:6, background:'rgba(52,199,150,0.12)', verticalAlign:'middle' }}><Sparkles size={13} color='#34c796' strokeWidth={2}/></div> {r.title ? r.title.replace(/\?\?/g, '') : ''}</span>
                    <span className="text-zinc-400">{r.description || (typeof r === 'string' ? r : r.text || r.recommendation)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label:'Start Chat',  desc:'Talk to EmoCare AI',        Icon: MessageCircle, path:'/chat',    color:'#34c796' },
          { label:'Journal',     desc:'Reflect on your day',        Icon: PenLine,       path:'/journal', color:'#a78bfa' },
          { label:'Breathe',     desc:'Calm your nervous system',   Icon: Wind,          path:'/breathe', color:'#38bdf8' },
          { label:'Mood Music',  desc:'Listen on YouTube Music',    Icon: Music,         isMusic:true,    color:'#fb923c' },
        ].map(({ label, desc, Icon, path, color, isMusic }) => (
          isMusic ? (
            <motion.button key={label} whileHover={{ y: -3, boxShadow: `0 12px 32px ${color}30` }} whileTap={{ scale: 0.97 }}
              onClick={() => { if (selectedMood) { window.open(`https://music.youtube.com/search?q=${encodeURIComponent(selectedMood + ' mood playlist')}`, '_blank'); } else { setMusicModal(true); } }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 18, textAlign: 'left', background: `${color}15`, border: `1px solid ${color}25`, cursor: 'pointer', transition: 'all 0.25s', width: '100%' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}25`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${color}30`, flexShrink: 0 }}>
                <Icon size={20} color={color} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#e8f5f0', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 12, color: 'rgba(232,245,240,0.38)' }}>{desc}</p>
              </div>
              <ChevronRight size={14} color='rgba(232,245,240,0.3)' />
            </motion.button>
          ) : (
            <motion.button key={label} whileHover={{ y: -3, boxShadow: `0 12px 32px ${color}30` }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate(path)}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 18, textAlign: 'left', background: `${color}15`, border: `1px solid ${color}25`, cursor: 'pointer', transition: 'all 0.25s', width: '100%' }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}25`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${color}30`, flexShrink: 0 }}>
                <Icon size={20} color={color} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#e8f5f0', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 12, color: 'rgba(232,245,240,0.38)' }}>{desc}</p>
              </div>
              <ChevronRight size={14} color='rgba(232,245,240,0.3)' />
            </motion.button>
          )
        ))}
      </motion.div>

      {/* Music Modal */}
      <AnimatePresence>
        {musicModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMusicModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ background: 'rgba(13,31,26,0.98)', border: '1px solid rgba(52,199,150,0.2)', borderRadius: 24, padding: 24, textAlign: 'center', maxWidth: 360, width: '100%', position: 'relative', zIndex: 1 }}>
              
              <h2 className="text-xl font-bold text-white mb-2">Find Mood Music</h2>
              <p className="text-sm text-zinc-400 mb-6">Select how you're feeling right now to get a customized YouTube Music playlist.</p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                {MOODS.map(mood => (
                  <button key={mood} onClick={() => {
                    window.open(`https://music.youtube.com/search?q=${encodeURIComponent(mood + ' mood playlist')}`, '_blank');
                    setMusicModal(false);
                  }}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:16, borderRadius:16, background:`${MOOD_COLORS[mood]}12`, border:`1px solid ${MOOD_COLORS[mood]}30`, cursor:'pointer', transition:'all 0.2s' }}
                    onMouseEnter={e=>e.currentTarget.style.background=`${MOOD_COLORS[mood]}25`}
                    onMouseLeave={e=>e.currentTarget.style.background=`${MOOD_COLORS[mood]}12`}>
                    <div style={{width:36,height:36,borderRadius:10,background:`${MOOD_COLORS[mood]}25`,border:`1px solid ${MOOD_COLORS[mood]}40`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {(() => { const MIcon = MOOD_ICONS[mood]; return <MIcon size={18} color={MOOD_COLORS[mood]} strokeWidth={2}/>; })()}
                    </div>
                    <span style={{fontSize:12,fontWeight:500,color:'rgba(232,245,240,0.7)'}}>{mood}</span>
                  </button>
                ))}
              </div>

              <button onClick={() => setMusicModal(false)} className="w-full py-3 rounded-xl font-medium text-zinc-300 bg-white/5 hover:bg-white/10 transition-colors">
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
