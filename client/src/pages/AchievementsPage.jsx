import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Lock, Star, CheckCircle, Zap, Leaf, Dumbbell, MessageCircle, Brain, BookOpen, PenLine, Wind, Target, Heart } from 'lucide-react';
import { api } from '../api';

const BADGES = [
  { id:'first_step',   Icon:Leaf, name:'First Step',        desc:'Logged your first mood',         xp:50  },
  { id:'streak_3',     Icon:Flame, name:'3-Day Streak',      desc:'Checked in 3 days in a row',      xp:75  },
  { id:'warrior_7',    Icon:Dumbbell, name:'7-Day Warrior',     desc:'7 consecutive days of check-ins', xp:150 },
  { id:'champion_30',  Icon:Trophy, name:'30-Day Champion',   desc:'30 days of consistent care',      xp:500 },
  { id:'chat_start',   Icon:MessageCircle, name:'Conversation Starter',desc:'Started your first AI chat',  xp:50  },
  { id:'deep_thinker', Icon:Brain, name:'Deep Thinker',      desc:'Completed 10 chat sessions',      xp:200 },
  { id:'journal_first',Icon:BookOpen, name:'Journal Keeper',    desc:'Wrote your first journal entry',  xp:50  },
  { id:'storyteller',  Icon:PenLine, name:'Storyteller',       desc:'Wrote 10 journal entries',        xp:200 },
  { id:'breath_master',Icon:Wind, name:'Breath Master',     desc:'Did 5 breathing sessions',        xp:100 },
  { id:'self_aware',   Icon:Target, name:'Self-Aware',        desc:'Logged 5 different emotions',     xp:150 },
  { id:'consistent',   Icon:Heart, name:'Consistent Care',   desc:'7 check-ins in one week',         xp:200 },
  { id:'emo_champ',    Icon:Star, name:'EmoCare Champion',  desc:'30 total sessions completed',     xp:400 },
];

const LEVELS = [
  { name:'Beginner',  min:0,    color:'#71717a' },
  { name:'Explorer',  min:200,  color:'#6ee7b7' },
  { name:'Mindful',   min:500,  color:'#34d399' },
  { name:'Warrior',   min:1000, color:'#34c796' },
  { name:'Champion',  min:2000, color:'#059669' },
];

export default function AchievementsPage() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getDashStats();
        setStats(data.stats || data);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  // Determine unlocked badges based on real stats
  const unlocked = new Set();
  if (stats) {
    if ((stats.totalMoods || 0) >= 1)         unlocked.add('first_step');
    if ((stats.dayStreak || 0) >= 3)           unlocked.add('streak_3');
    if ((stats.dayStreak || 0) >= 7)           unlocked.add('warrior_7');
    if ((stats.dayStreak || 0) >= 30)          unlocked.add('champion_30');
    if ((stats.totalSessions || 0) >= 1)       unlocked.add('chat_start');
    if ((stats.totalSessions || 0) >= 10)      unlocked.add('deep_thinker');
    if ((stats.journalEntries || 0) >= 1)      unlocked.add('journal_first');
    if ((stats.journalEntries || 0) >= 10)     unlocked.add('storyteller');
    if ((stats.totalSessions || 0) >= 30)      unlocked.add('emo_champ');
    if ((stats.dayStreak || 0) >= 7)           unlocked.add('consistent');
  }

  // XP = sum of unlocked badge XP
  const totalXP = BADGES.filter(b => unlocked.has(b.id)).reduce((s, b) => s + b.xp, 0);
  const currentLevel = [...LEVELS].reverse().find(l => totalXP >= l.min) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.findIndex(l => l.name === currentLevel.name) + 1];
  const xpPct = nextLevel ? Math.min(((totalXP - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100, 100) : 100;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Achievements</h1>
        <p className="text-sm text-zinc-500 mt-1">Track your wellness milestones and streaks.</p>
      </div>

      {/* Streak + Level Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Streak card */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          className="rounded-2xl p-5 text-center"
          style={{ background:'linear-gradient(135deg, rgba(52,199,150,0.15), rgba(45,168,126,0.1))', border:'1px solid rgba(52,199,150,0.25)' }}>
          <motion.div animate={{ scale:[1,1.08,1] }} transition={{ duration:2, repeat:Infinity }} className="flex justify-center mb-2">
            <Flame size={48} className="text-[#34c796]" />
          </motion.div>
          <p className="text-4xl font-bold text-white">{loading ? '—' : (stats?.dayStreak || 0)}</p>
          <p className="text-sm text-orange-400 font-medium">Day Streak</p>
          <p className="text-xs text-zinc-600 mt-1">Best: {stats?.dayStreak || 0} days</p>
        </motion.div>

        {/* Level + XP card */}
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
          className="rounded-2xl p-5"
          style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Current Level</p>
              <p className="text-lg font-bold" style={{ color: currentLevel.color }}>{currentLevel.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 mb-0.5">Total XP</p>
              <p className="text-lg font-bold text-white">{totalXP}</p>
            </div>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width:0 }} animate={{ width:`${xpPct}%` }}
              transition={{ delay:0.3, duration:1, ease:'easeOut' }}
              className="h-full rounded-full"
              style={{ background:`linear-gradient(90deg, ${currentLevel.color}, ${nextLevel?.color || '#f59e0b'})` }} />
          </div>
          <p className="text-[10px] text-zinc-600 mt-1.5 flex items-center gap-1">
            {nextLevel ? `${totalXP}/${nextLevel.min} XP to ${nextLevel.name}` : <><Trophy size={10} className="text-zinc-600" /> Max level reached!</>}
          </p>
          <div className="flex justify-between mt-2">
            {LEVELS.map(l => (
              <div key={l.name} className="flex flex-col items-center gap-0.5">
                <div className="w-2 h-2 rounded-full" style={{ background: totalXP >= l.min ? l.color : 'rgba(255,255,255,0.1)' }} />
                <p className="text-[9px] text-zinc-700">{l.name[0]}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Badges Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={14} className="text-zinc-500" />
          <p className="text-sm font-medium text-zinc-400">
            Badges — {unlocked.size}/{BADGES.length} unlocked
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {BADGES.map((badge, i) => {
            const isUnlocked = unlocked.has(badge.id);
            return (
              <motion.div key={badge.id}
                initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
                transition={{ delay: i * 0.04 }}
                className="p-4 rounded-2xl text-center relative overflow-hidden"
                style={{
                  background: isUnlocked ? 'rgba(52,199,150,0.1)' : 'rgba(18,18,22,0.5)',
                  border: isUnlocked ? '1px solid rgba(52,199,150,0.25)' : '1px solid rgba(255,255,255,0.04)',
                  opacity: isUnlocked ? 1 : 0.5,
                }}>
                {isUnlocked && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle size={11} className="text-emerald-400" />
                  </div>
                )}
                {!isUnlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock size={10} className="text-zinc-700" />
                  </div>
                )}
                <div className="flex justify-center mb-2" style={{ filter: isUnlocked ? 'none' : 'grayscale(100%)' }}>
                  <div style={{ width:40, height:40, borderRadius:12, background:'rgba(52,199,150,0.12)', border:'1px solid rgba(52,199,150,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <badge.Icon size={20} color='#34c796' strokeWidth={1.8} />
                  </div>
                </div>
                <p className="text-xs font-semibold text-white mb-0.5">{badge.name}</p>
                <p className="text-[10px] text-zinc-600 leading-snug">{badge.desc}</p>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <Zap size={9} className={isUnlocked ? 'text-yellow-400' : 'text-zinc-700'} />
                  <span className={`text-[10px] font-medium ${isUnlocked ? 'text-yellow-400' : 'text-zinc-700'}`}>{badge.xp} XP</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
