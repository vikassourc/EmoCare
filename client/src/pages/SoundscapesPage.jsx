import { motion } from 'framer-motion';
import { Music, Headphones, Flame, Heart, Wind, Droplets, Sparkles, Coffee, Moon, Sun, Cloud, Zap } from 'lucide-react';

const MOOD_PLAYLISTS = [
  { name: 'Happy', Icon: Sun, color: '#10b981', bg: 'rgba(16,185,129,0.1)', desc: 'Upbeat pop, dance, and feel-good anthems.' },
  { name: 'Sad', Icon: Cloud, color: '#6366f1', bg: 'rgba(99,102,241,0.1)', desc: 'Melancholy acoustic, indie, and comfort songs.' },
  { name: 'Anxious', Icon: Wind, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', desc: 'Calming frequencies, relief, and slow tempos.' },
  { name: 'Stressed', Icon: Coffee, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', desc: 'Relaxing lo-fi beats, study, and chillhop.' },
  { name: 'Calm', Icon: Droplets, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', desc: 'Peaceful ambient, nature sounds, and zen.' },
  { name: 'Numb', Icon: Moon, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', desc: 'Deep focus instrumental and atmospheric.' },
  { name: 'Angry', Icon: Flame, color: '#f97316', bg: 'rgba(249,115,22,0.1)', desc: 'Heavy rock, metal, and intense workout music.' },
  { name: 'Excited', Icon: Zap, color: '#ec4899', bg: 'rgba(236,72,153,0.1)', desc: 'Party hits, hyperpop, and high energy.' },
  { name: 'Grateful', Icon: Heart, color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', desc: 'Warm acoustic, soul, and morning folk.' },
  { name: 'Hopeful', Icon: Sparkles, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', desc: 'Uplifting cinematic, inspirational, and epic.' },
];

export default function SoundscapesPage() {
  const openPlaylist = (moodName) => {
    window.open(`https://music.youtube.com/search?q=${encodeURIComponent(moodName + ' mood playlist')}`, '_blank');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Headphones className="text-indigo-400" size={28} />
          Soundscapes
        </h1>
        <p className="text-zinc-400">Discover curated YouTube Music playlists perfectly tailored to your current emotional state.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MOOD_PLAYLISTS.map((mood, i) => {
          return (
            <motion.button
              key={mood.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => openPlaylist(mood.name)}
              className="relative p-5 rounded-3xl border text-left overflow-hidden group transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at 100% 100%, ${mood.color}20 0%, transparent 70%)` }}
              />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner border border-white/5 transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: mood.bg }}>
                    <mood.Icon size={24} color={mood.color} strokeWidth={1.8} />
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-zinc-500 group-hover:text-white group-hover:bg-indigo-500/20 transition-colors">
                    <Music size={14} />
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  {mood.name}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {mood.desc}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
