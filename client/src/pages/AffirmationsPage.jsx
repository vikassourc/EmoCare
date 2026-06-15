import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Copy, RefreshCw, Bell, Check, Star, Sparkles } from 'lucide-react';

const AFFIRMATIONS = {
  'Self-Love': [
    "I am worthy of love, care, and respect — exactly as I am right now.",
    "I honour my feelings without judgment. They are valid and important.",
    "I am becoming the best version of myself, one small step at a time.",
    "I deserve peace, joy, and all the good things life has to offer.",
    "My imperfections make me beautifully human, not broken.",
  ],
  'Anxiety': [
    "I am safe in this present moment. My breath is my anchor.",
    "This feeling is temporary. I have survived every difficult moment before this.",
    "I release what I cannot control and trust in my ability to cope.",
    "My mind is calm. My body is relaxed. I am at peace.",
    "I choose to focus on what I can influence, not what I cannot.",
  ],
  'Confidence': [
    "I trust my instincts and believe in my own abilities.",
    "Every challenge I face is an opportunity to grow stronger.",
    "I am capable, resilient, and more powerful than I sometimes feel.",
    "I speak my truth with kindness and confidence.",
    "I have overcome hard things before — I can do it again.",
  ],
  'Gratitude': [
    "I find beauty and meaning even in ordinary moments.",
    "My life is full of small blessings I sometimes forget to notice.",
    "I am grateful for every person who has shown me kindness.",
    "The fact that I'm still here, still trying — that is something to be proud of.",
    "I choose to see the light, even when the clouds feel heavy.",
  ],
  'Healing': [
    "Healing is not linear, and that's okay. I am still healing.",
    "I give myself permission to take things one breath at a time.",
    "Every day I choose to show up for myself is an act of courage.",
    "I am not my past. I am the person choosing to move forward today.",
    "My pain has shaped me, but it does not define me.",
  ],
};

const ALL = Object.entries(AFFIRMATIONS).flatMap(([cat, items]) => items.map(text => ({ text, category: cat })));

const CATEGORY_COLORS = {
  'All':        { bg:'rgba(52,199,150,0.1)',  border:'rgba(52,199,150,0.3)',  text:'#34c796' },
  'Self-Love':  { bg:'rgba(52,199,150,0.1)',  border:'rgba(52,199,150,0.3)',  text:'#34c796' },
  'Anxiety':    { bg:'rgba(52,199,150,0.1)',  border:'rgba(52,199,150,0.3)',  text:'#34c796' },
  'Confidence': { bg:'rgba(52,199,150,0.1)',  border:'rgba(52,199,150,0.3)',  text:'#34c796' },
  'Gratitude':  { bg:'rgba(52,199,150,0.1)',  border:'rgba(52,199,150,0.3)', text:'#34c796' },
  'Healing':    { bg:'rgba(52,199,150,0.1)',  border:'rgba(52,199,150,0.3)',  text:'#34c796' },
};

export default function AffirmationsPage() {
  const dayIndex = Math.floor(Date.now() / 86400000) % ALL.length;
  const [featured, setFeatured]   = useState(ALL[dayIndex]);
  const [category, setCategory]   = useState('All');
  const [copied, setCopied]       = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('emo_affirmation_favs') || '[]'); } catch { return []; }
  });

  const filtered = category === 'All' ? ALL : ALL.filter(a => a.category === category);

  const randomize = () => {
    const pool = category === 'All' ? ALL : filtered;
    setFeatured(pool[Math.floor(Math.random() * pool.length)]);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(featured.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFav = (text) => {
    setFavorites(favs => {
      const next = favs.includes(text) ? favs.filter(f => f !== text) : [...favs, text];
      localStorage.setItem('emo_affirmation_favs', JSON.stringify(next));
      return next;
    });
  };

  const cats = ['All', ...Object.keys(AFFIRMATIONS)];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Daily Affirmations</h1>
        <p className="text-sm text-zinc-500 mt-1">Gentle reminders to nurture your mind.</p>
      </div>

      {/* Hero Affirmation Card */}
      <motion.div key={featured.text}
        initial={{ opacity:0, scale:0.97 }} animate={{ opacity:1, scale:1 }}
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{
          background:'linear-gradient(135deg, rgba(52,199,150,0.2), rgba(45,168,126,0.15), rgba(52,199,150,0.1))',
          border:'1px solid rgba(52,199,150,0.25)',
          boxShadow:'0 8px 40px rgba(52,199,150,0.15)',
        }}>
        {/* Decorative blob */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
          style={{ background:'radial-gradient(circle, #34c796, transparent)' }} />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-15"
          style={{ background:'radial-gradient(circle, #2da87e, transparent)' }} />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={CATEGORY_COLORS[featured.category]}>
              {featured.category}
            </span>
            <span className="text-yellow-400"><Sparkles size={24} color="#fbbf24" strokeWidth={1.5} /></span>
          </div>

          <blockquote className="text-lg font-medium text-white leading-relaxed mb-5">
            "{featured.text}"
          </blockquote>

          <div className="flex gap-2 flex-wrap">
            <motion.button onClick={copy} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 bg-white/10 hover:bg-white/15 transition-colors border border-white/10">
              {copied ? <><Check size={12} className="text-emerald-400" /> Copied!</> : <><Copy size={12} /> Copy</>}
            </motion.button>
            <motion.button onClick={randomize} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 bg-white/10 hover:bg-white/15 transition-colors border border-white/10">
              <RefreshCw size={12} /> New Affirmation
            </motion.button>
            <motion.button onClick={() => toggleFav(featured.text)} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors border"
              style={favorites.includes(featured.text)
                ? { background:'rgba(52,199,150,0.15)', borderColor:'rgba(52,199,150,0.3)', color:'#34c796' }
                : { background:'rgba(255,255,255,0.05)', borderColor:'rgba(255,255,255,0.1)', color:'#71717a' }}>
              <Heart size={12} fill={favorites.includes(featured.text) ? 'currentColor' : 'none'} />
              {favorites.includes(featured.text) ? 'Saved' : 'Save'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {cats.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all border"
            style={category === cat
              ? (CATEGORY_COLORS[cat] || CATEGORY_COLORS['All'])
              : { background:'rgba(255,255,255,0.04)', borderColor:'rgba(255,255,255,0.07)', color:'#71717a' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Affirmation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(({ text, category: cat }, i) => (
          <motion.div key={text} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.03 }}
            className="p-4 rounded-2xl group"
            style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={CATEGORY_COLORS[cat]}>{cat}</span>
              <button onClick={() => toggleFav(text)}
                className="text-zinc-700 hover:text-emerald-400 transition-colors flex-shrink-0">
                <Heart size={13} fill={favorites.includes(text) ? '#34c796' : 'none'}
                  stroke={favorites.includes(text) ? '#34c796' : 'currentColor'} />
              </button>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">"{text}"</p>
          </motion.div>
        ))}
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <div>
          <p className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
            <Heart size={13} className="text-emerald-400" fill="#34c796" /> Saved Affirmations ({favorites.length})
          </p>
          <div className="space-y-2">
            {favorites.map((text, i) => (
              <motion.div key={text} layout initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="flex items-start gap-3 p-3.5 rounded-xl"
                style={{ background:'rgba(52,199,150,0.06)', border:'1px solid rgba(52,199,150,0.15)' }}>
                <Heart size={12} className="text-emerald-400 flex-shrink-0 mt-0.5" fill="#34c796" />
                <p className="text-sm text-zinc-300 flex-1">"{text}"</p>
                <button onClick={() => toggleFav(text)} className="text-zinc-700 hover:text-zinc-400 text-xs">✕</button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
