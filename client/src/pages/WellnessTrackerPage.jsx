import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Moon, Activity, Zap, Plus, Minus, CheckCircle, TrendingUp, Footprints, Wind, Flame } from 'lucide-react';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const TODAY_KEY = () => new Date().toISOString().split('T')[0];
const WEEK_KEYS = () => {
  const keys = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    keys.push(d.toISOString().split('T')[0]);
  }
  return keys;
};

const EXERCISE_OPTS = ['None','Light','Moderate','Intense'];
const EXERCISE_COLORS = { None:'text-zinc-600', Light:'text-emerald-400', Moderate:'text-blue-400', Intense:'text-rose-400' };

const TIPS = [
  { Icon:Droplets, title:'Hydration', color:'from-sky-500/15 to-blue-500/10', border:'border-sky-500/15',
    tip:'Aim for 8 glasses of water daily. Start your morning with a full glass before anything else.' },
  { Icon:Moon, title:'Sleep Hygiene', color:'from-teal-500/15 to-emerald-500/10', border:'border-teal-500/15',
    tip:'Keep a consistent sleep schedule. Avoid screens 30 min before bed and keep your room cool and dark.' },
  { Icon:Footprints, title:'Movement', color:'from-emerald-500/15 to-teal-500/10', border:'border-emerald-500/15',
    tip:'Even 20 minutes of walking reduces stress hormones and boosts mood-lifting endorphins.' },
  { Icon:Wind, title:'Stress Relief', color:'from-orange-500/15 to-amber-500/10', border:'border-orange-500/15',
    tip:'The 5-4-3-2-1 grounding technique: name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.' },
];

export default function WellnessTrackerPage() {
  const [sleep, setSleep]     = useState(7);
  const [water, setWater]     = useState(0);
  const [exercise, setExercise] = useState('None');
  const [stress, setStress]   = useState(5);
  const [saved, setSaved]     = useState(false);
  const [weekData, setWeekData] = useState({});

  useEffect(() => {
    // Load week data from localStorage
    const data = {};
    WEEK_KEYS().forEach(k => {
      const raw = localStorage.getItem(`emo_wellness_${k}`);
      if (raw) try { data[k] = JSON.parse(raw); } catch {}
    });
    setWeekData(data);

    // Pre-fill today if already saved
    const today = localStorage.getItem(`emo_wellness_${TODAY_KEY()}`);
    if (today) {
      try {
        const d = JSON.parse(today);
        setSleep(d.sleep ?? 7);
        setWater(d.water ?? 0);
        setExercise(d.exercise ?? 'None');
        setStress(d.stress ?? 5);
      } catch {}
    }
  }, []);

  const saveToday = () => {
    const entry = { sleep, water, exercise, stress, date: TODAY_KEY() };
    localStorage.setItem(`emo_wellness_${TODAY_KEY()}`, JSON.stringify(entry));
    setWeekData(w => ({ ...w, [TODAY_KEY()]: entry }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const stressColor = `hsl(${Math.round((10 - stress) * 12)}, 70%, 55%)`;
  const sleepColor = sleep >= 7 ? '#10b981' : sleep >= 5 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Wellness Tracker</h1>
        <p className="text-sm text-zinc-500 mt-1">Track your daily habits and physical wellbeing.</p>
      </div>

      {/* Today's check-in */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        className="rounded-2xl p-5 space-y-5"
        style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-sm font-semibold text-white">Today's Check-in
          <span className="ml-2 text-[11px] font-normal text-zinc-600">
            {new Date().toLocaleDateString('en-IN', { weekday:'long', month:'short', day:'numeric' })}
          </span>
        </p>

        {/* Sleep */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Moon size={14} style={{ color: sleepColor }} />
              <p className="text-sm font-medium text-zinc-300">Sleep</p>
            </div>
            <span className="text-sm font-bold" style={{ color: sleepColor }}>{sleep} hrs</span>
          </div>
          <input type="range" min={0} max={12} step={0.5} value={sleep} onChange={e => setSleep(+e.target.value)}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ background:`linear-gradient(to right, ${sleepColor} ${(sleep/12)*100}%, rgba(255,255,255,0.1) ${(sleep/12)*100}%)` }} />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-zinc-700">0h</span>
            <span className="text-[10px] text-zinc-600">Goal: 7–9h</span>
            <span className="text-[10px] text-zinc-700">12h</span>
          </div>
        </div>

        {/* Water */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets size={14} className="text-sky-400" />
              <p className="text-sm font-medium text-zinc-300">Water Intake</p>
            </div>
            <span className="text-sm font-bold text-sky-400">{water} / 8 glasses</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setWater(w => Math.max(0, w - 1))}
              className="w-8 h-8 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-zinc-400 hover:bg-white/10 transition-colors">
              <Minus size={13} />
            </button>
            <div className="flex-1 flex gap-1.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div key={i}
                  animate={{ scale: i < water ? 1 : 0.85, opacity: i < water ? 1 : 0.2 }}
                  className="flex-1 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: i < water ? 'rgba(14,165,233,0.25)' : 'rgba(255,255,255,0.04)', border: i < water ? '1px solid rgba(14,165,233,0.4)' : '1px solid rgba(255,255,255,0.05)' }}>
                  {i < water ? <Droplets size={14} className="text-sky-400" /> : null}
                </motion.div>
              ))}
            </div>
            <button onClick={() => setWater(w => Math.min(8, w + 1))}
              className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-400 hover:bg-sky-500/25 transition-colors">
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* Exercise */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-emerald-400" />
            <p className="text-sm font-medium text-zinc-300">Exercise</p>
          </div>
          <div className="flex gap-2">
            {EXERCISE_OPTS.map(opt => (
              <button key={opt} onClick={() => setExercise(opt)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                  exercise === opt
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border-white/5 text-zinc-600 hover:text-zinc-300'
                }`}>{opt}</button>
            ))}
          </div>
        </div>

        {/* Stress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: stressColor }} />
              <p className="text-sm font-medium text-zinc-300">Stress Level</p>
            </div>
            <span className="text-sm font-bold" style={{ color: stressColor }}>{stress}/10</span>
          </div>
          <input type="range" min={1} max={10} value={stress} onChange={e => setStress(+e.target.value)}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ background:`linear-gradient(to right, ${stressColor} ${(stress-1)*11.1}%, rgba(255,255,255,0.1) ${(stress-1)*11.1}%)` }} />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-zinc-700">Very calm</span>
            <span className="text-[10px] text-zinc-700">Overwhelmed</span>
          </div>
        </div>

        <motion.button onClick={saveToday} whileHover={{ scale:1.01 }} whileTap={{ scale:0.97 }}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{
            background: saved ? 'rgba(52,199,150,0.15)' : 'linear-gradient(135deg, #34c796, #2da87e)',
            border: saved ? '1px solid rgba(52,199,150,0.3)' : 'none',
            color: saved ? '#34c796' : '#050c0a',
            boxShadow: saved ? 'none' : '0 4px 16px rgba(52,199,150,0.3)',
          }}>
          {saved ? <><CheckCircle size={14} /> Saved!</> : '💾 Save Today\'s Data'}
        </motion.button>
      </motion.div>

      {/* Weekly Overview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-zinc-500" />
          <p className="text-sm font-medium text-zinc-400">7-Day Overview</p>
        </div>
        <div className="rounded-2xl overflow-hidden"
          style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="grid grid-cols-7 border-b border-white/5">
            {WEEK_KEYS().map((key, i) => {
              const d = new Date(key);
              const dayName = DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];
              const isToday = key === TODAY_KEY();
              return (
                <div key={key} className={`p-2 text-center border-r border-white/5 last:border-r-0 ${isToday ? 'bg-emerald-500/10' : ''}`}>
                  <p className={`text-[10px] font-medium ${isToday ? 'text-[#34c796]' : 'text-zinc-600'}`}>{dayName}</p>
                  <p className={`text-[10px] ${isToday ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {d.getDate()}
                  </p>
                </div>
              );
            })}
          </div>
          {[
            { label:<Moon size={10} className="inline mb-0.5"/>, key:'sleep', format: v => `${v}h`, goal: v => v >= 7 },
            { label:<Droplets size={10} className="inline mb-0.5"/>, key:'water', format: v => `${v}g`, goal: v => v >= 6 },
            { label:<Activity size={10} className="inline mb-0.5"/>, key:'exercise', format: v => v?.[0] || '—', goal: v => v !== 'None' },
            { label:<Flame size={10} className="inline mb-0.5"/>, key:'stress', format: v => `${v}`, goal: v => v <= 5 },
          ].map(({ label, key, format, goal }) => (
            <div key={key} className="grid grid-cols-7 border-b border-white/5 last:border-b-0">
              {WEEK_KEYS().map(dayKey => {
                const entry = weekData[dayKey];
                const val = entry?.[key];
                const hasData = val !== undefined && val !== null;
                const isGood = hasData && goal(val);
                return (
                  <div key={dayKey} className="p-2 text-center border-r border-white/5 last:border-r-0">
                    {hasData ? (
                      <p className={`text-[10px] font-medium ${isGood ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {label} {format(val)}
                      </p>
                    ) : (
                      <p className="text-[10px] text-zinc-800">—</p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TIPS.map(({ Icon, title, color, border, tip }, i) => (
          <motion.div key={title} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
            transition={{ delay: i * 0.06 }}
            className={`p-4 rounded-2xl bg-gradient-to-br ${color} border ${border}`}>
            <div className="mb-2"><Icon size={24} className="text-white opacity-80" /></div>
            <p className="text-sm font-semibold text-white mb-1">{title}</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">{tip}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
