import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Brain, MessageCircle, BookOpen, BarChart2, TrendingUp,
  Shield, Zap, Globe, CheckCircle, CheckCircle2, Heart, Leaf, Smile,
  Star, Wind, Activity, Target,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PremiumIcon, AvatarIcon } from '../components/PremiumIcon';

/* ─── Premium icon configs ─── */
const FEATURE_ICONS = [
  { Icon: Activity,       gradient: 'linear-gradient(135deg,#34c796,#2da87e)',    glow: 'rgba(52,199,150,0.4)'  },
  { Icon: MessageCircle,  gradient: 'linear-gradient(135deg,#38bdf8,#0ea5e9)',    glow: 'rgba(56,189,248,0.4)'  },
  { Icon: BookOpen,       gradient: 'linear-gradient(135deg,#a78bfa,#7c3aed)',    glow: 'rgba(167,139,250,0.4)' },
  { Icon: BarChart2,      gradient: 'linear-gradient(135deg,#fb923c,#ea580c)',    glow: 'rgba(251,146,60,0.4)'  },
];

const FEATURES = [
  { title: 'Emotional Check-ins',  desc: 'Daily mood tracking with AI pattern recognition — see your emotional trends through beautiful, interactive visualizations.', preview: 'mood'      },
  { title: 'AI Companion Chat',    desc: 'Natural, empathetic conversations available 24/7 — listen first, guide second, always non-judgmental.',                       preview: 'chat'      },
  { title: 'Guided Journaling',    desc: 'AI-crafted prompts and a private digital journal to process thoughts and decode your emotions deeply.',                        preview: 'journal'   },
  { title: 'Wellness Dashboard',   desc: 'Visual insights into your emotional health — mood charts, trigger analysis, and personalized growth indicators.',              preview: 'dashboard' },
];

const STEPS = [
  { num: '01', title: 'Check in daily', desc: 'Take 30 seconds to log your mood and what\'s on your mind.' },
  { num: '02', title: 'Talk it out', desc: 'Chat with EmoCare AI about your feelings — deep listening, zero judgment.' },
  { num: '03', title: 'Gain insight', desc: 'Get personalized analysis of your emotional patterns and practical action steps.' },
  { num: '04', title: 'Grow stronger', desc: 'Track progress with dashboards and build emotional resilience every day.' },
];

const TESTIMONIALS = [
  { stars: 5, quote: '"EmoCare has genuinely changed how I handle stress. It feels like talking to a friend who truly listens — I open up in ways I never expected."',                                            name: 'Sarah M.',  role: 'Teacher, using EmoCare for 4 months',         initials: 'SM', gradient: 'linear-gradient(135deg,#34c796,#2da87e)' },
  { stars: 5, quote: '"The mood tracking and journaling together are incredibly powerful. I can actually see my emotional patterns now — that awareness alone is transformative."',                                 name: 'James T.',  role: 'Software Engineer, daily user',               initials: 'JT', gradient: 'linear-gradient(135deg,#38bdf8,#0ea5e9)' },
  { stars: 5, quote: '"I was skeptical about AI for mental wellness, but EmoCare surprised me. The compassion and depth of insight is remarkable. I feel genuinely supported."',                                  name: 'Priya K.',  role: 'Healthcare professional, 6 months',           initials: 'PK', gradient: 'linear-gradient(135deg,#a78bfa,#7c3aed)' },
];

const TRUST = [
  { Icon: Shield,       label: '100% Private & Secure',        glow: 'rgba(52,199,150,0.3)'  },
  { Icon: Brain,        label: 'Evidence-Based Approaches',     glow: 'rgba(56,189,248,0.3)'  },
  { Icon: Zap,          label: 'Instant AI Response',           glow: 'rgba(251,146,60,0.3)'  },
  { Icon: Globe,        label: 'Available Everywhere',          glow: 'rgba(167,139,250,0.3)' },
  { Icon: CheckCircle,  label: 'No Judgment, Ever',             glow: 'rgba(52,199,150,0.3)'  },
];

/* ─────────────────── PREVIEW PANELS ────────────────── */
function PreviewMood() {
  const bars = [40, 65, 50, 85, 70, 55, 95];
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div style={{ background: 'rgba(15,28,22,0.7)', border: '1px solid rgba(52,199,150,0.15)', borderRadius: 24, padding: 32 }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(52,199,150,0.7)', marginBottom: 8 }}>Mood This Week</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginBottom: 24 }}>
        {bars.map((h, i) => (
          <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.08, duration: 0.5 }}
            style={{ flex: 1, borderRadius: '6px 6px 0 0', background: h > 60 ? 'linear-gradient(180deg,#34c796,#2da87e)' : 'rgba(52,199,150,0.25)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {days.map(d => <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(232,245,240,0.3)' }}>{d}</div>)}
      </div>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: 36, color: '#e8f5f0', marginBottom: 4 }}>Good ✨</p>
      <p style={{ fontSize: 13, color: '#34c796' }}>↑ 23% improvement this week</p>
    </div>
  );
}

function PreviewChat() {
  const msgs = [
    { ai: true, text: 'Hi there 💚 How are you feeling right now?' },
    { ai: false, text: "I've been feeling overwhelmed lately..." },
    { ai: true, text: 'I hear you. Can you tell me what\'s been weighing on you most? 🌿' },
  ];
  return (
    <div style={{ background: 'rgba(15,28,22,0.7)', border: '1px solid rgba(52,199,150,0.15)', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(52,199,150,0.7)', marginBottom: 4 }}>Today's Session</p>
      {msgs.map((m, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}
          style={{
            alignSelf: m.ai ? 'flex-start' : 'flex-end',
            maxWidth: '85%',
            padding: '10px 14px',
            borderRadius: m.ai ? '4px 18px 18px 18px' : '18px 18px 4px 18px',
            background: m.ai ? 'rgba(52,199,150,0.12)' : 'linear-gradient(135deg,#34c796,#2da87e)',
            border: m.ai ? '1px solid rgba(52,199,150,0.2)' : 'none',
            color: m.ai ? '#d0f0e8' : '#050c0a',
            fontSize: 13,
            fontWeight: m.ai ? 400 : 500,
            lineHeight: 1.5,
          }}>
          {m.text}
        </motion.div>
      ))}
      <p style={{ fontSize: 13, color: '#34c796', marginTop: 8, display:'flex', alignItems:'center', gap:4 }}>
        <CheckCircle2 size={13} color='#34c796' strokeWidth={2}/> 12 min session today
      </p>
    </div>
  );
}

function PreviewJournal() {
  return (
    <div style={{ background: 'rgba(15,28,22,0.7)', border: '1px solid rgba(52,199,150,0.15)', borderRadius: 24, padding: 32 }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(52,199,150,0.7)', marginBottom: 16 }}>Today's Prompt</p>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontStyle: 'italic', color: '#e8f5f0', lineHeight: 1.6, marginBottom: 24 }}>
        "What's one thing that brought you unexpected joy today, however small?"
      </p>
      <div style={{ background: 'rgba(52,199,150,0.06)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'rgba(232,245,240,0.5)', lineHeight: 1.7 }}>The morning coffee ritual. Holding a warm cup and watching light shift through the window...</p>
      </div>
      <p style={{ fontSize: 13, color: '#34c796', display:'flex', alignItems:'center', gap:6 }}>
        <Leaf size={13} color='#34c796' strokeWidth={2}/> 47 entries · 3-month streak
      </p>
    </div>
  );
}

function PreviewDashboard() {
  return (
    <div style={{ background: 'rgba(15,28,22,0.7)', border: '1px solid rgba(52,199,150,0.15)', borderRadius: 24, padding: 32 }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'rgba(52,199,150,0.7)', marginBottom: 8 }}>Wellness Score</p>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: 64, color: '#e8f5f0', lineHeight: 1, marginBottom: 4 }}>84</p>
      <p style={{ fontSize: 13, color: '#34c796', marginBottom: 20 }}>↑ Up from 61 last month</p>
      <div style={{ background: 'rgba(52,199,150,0.08)', border: '1px solid rgba(52,199,150,0.15)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: 'rgba(232,245,240,0.5)' }}>
        <span style={{display:'inline-flex',alignItems:'center',gap:6}}><Target size={13} color='#34c796' strokeWidth={2}/> Top trigger: Work deadlines</span>
      </div>
    </div>
  );
}

const PREVIEWS = { mood: PreviewMood, chat: PreviewChat, journal: PreviewJournal, dashboard: PreviewDashboard };

/* ─────────────────── REVEAL WRAPPER ────────────────── */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

/* ══════════════════ MAIN COMPONENT ══════════════════ */
export default function LandingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const PreviewComponent = PREVIEWS[FEATURES[activeTab].preview];

  return (
    <div style={{ background: '#050c0a', color: '#e8f5f0', fontFamily: "'Outfit', 'Inter', sans-serif", overflowX: 'hidden', minHeight: '100vh' }}>

      {/* ── AMBIENT BACKGROUND ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <motion.div initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 0.25 }} transition={{ duration: 3, ease: 'easeOut' }}
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'url(/landing_hero.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            mixBlendMode: 'screen',
            filter: 'blur(4px) saturate(1.5)'
          }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,12,10,0.8) 0%, rgba(5,12,10,0.95) 100%)' }} />
        
        <motion.div animate={{ x: [0, 80, 0], y: [0, 50, 0], scale: [1, 1.15, 1] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(52,199,150,0.15) 0%, transparent 70%)', top: -200, left: -200, mixBlendMode: 'screen' }} />
        <motion.div animate={{ x: [0, -60, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(56,189,248,0.12) 0%, transparent 70%)', bottom: -100, right: -100, mixBlendMode: 'screen' }} />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{ position: 'absolute', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(167,139,250,0.08) 0%, transparent 70%)', top: '20%', left: '30%', mixBlendMode: 'screen' }} />
        
        {/* Mesh grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(52,199,150,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(52,199,150,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)'
        }} />
      </div>

      {/* ══ NAVBAR ══ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: scrolled ? '12px 48px' : '18px 48px',
          background: scrolled ? 'rgba(5,12,10,0.95)' : 'rgba(5,12,10,0.60)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(52,199,150,0.08)',
          transition: 'all 0.3s ease',
        }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <img src="/emocare_logo_new.png" alt="EmoCare" onError={e => e.target.style.display = 'none'}
            style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(52,199,150,0.25)', boxShadow: '0 0 16px rgba(52,199,150,0.3)' }} />
          <span style={{ fontWeight: 700, fontSize: 20, background: 'linear-gradient(135deg,#34c796,#7effd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.3px' }}>
            EmoCare
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {[['Chat', '/chat'], ['Dashboard', '/dashboard'], ['Journal', '/journal'], ['Breathe', '/breathe']].map(([label, path]) => (
            <Link key={label} to={path} style={{ fontSize: 14, fontWeight: 500, color: 'rgba(232,245,240,0.55)', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#34c796'} onMouseLeave={e => e.target.style.color = 'rgba(232,245,240,0.55)'}>
              {label}
            </Link>
          ))}
        </div>

        <Link to={user ? '/dashboard' : '/login'}>
          <motion.button whileHover={{ scale: 1.04, boxShadow: '0 0 36px rgba(52,199,150,0.45)' }} whileTap={{ scale: 0.97 }}
            style={{
              background: 'linear-gradient(135deg,#34c796,#2da87e)', color: '#050c0a',
              fontWeight: 600, fontSize: 14, padding: '10px 22px', borderRadius: 100,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 0 24px rgba(52,199,150,0.25)',
            }}>
            {user ? 'Dashboard' : 'Start Free'}
          </motion.button>
        </Link>
      </motion.nav>

      {/* ══ HERO ══ */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '130px 48px 80px', display: 'flex', alignItems: 'center', gap: 60, minHeight: '100vh' }}>

        {/* Left */}
        <div style={{ flex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(52,199,150,0.1)', border: '1px solid rgba(52,199,150,0.25)', borderRadius: 100, padding: '8px 18px', fontSize: 13, fontWeight: 500, color: '#34c796', marginBottom: 32 }}>
            <motion.span animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 6, height: 6, background: '#34c796', borderRadius: '50%', display: 'inline-block' }} />
            AI-Powered Emotional Wellness
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 86, fontWeight: 400, lineHeight: 1.05, color: '#ffffff', marginBottom: 28, textShadow: '0 0 40px rgba(255,255,255,0.1)' }}>
            Feel truly{' '}
            <span style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#34c796,#7effd4,#4eb8a0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 40px rgba(52,199,150,0.4)' }}>
              heard.
            </span>
            <br />
            Grow{' '}
            <span style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#38bdf8,#7dd3fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 0 40px rgba(56,189,248,0.4)' }}>
              stronger.
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            style={{ fontSize: 18, lineHeight: 1.75, color: 'rgba(232,245,240,0.55)', maxWidth: 480, marginBottom: 44, fontWeight: 300 }}>
            EmoCare is your compassionate AI companion — always available, always understanding. Track emotions, gain deep insights, and build lasting mental resilience.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 64, flexWrap: 'wrap' }}>
            <Link to={user ? '/chat' : '/login'}>
              <motion.button whileHover={{ scale: 1.04, y: -3, boxShadow: '0 0 60px rgba(52,199,150,0.5)' }} whileTap={{ scale: 0.97 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#34c796,#2da87e)', color: '#050c0a', fontFamily: 'inherit', fontWeight: 600, fontSize: 16, padding: '16px 36px', borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: '0 0 40px rgba(52,199,150,0.3)' }}>
                Begin Your Journey <span>→</span>
              </motion.button>
            </Link>
            <Link to="/dashboard">
              <motion.button whileHover={{ borderColor: 'rgba(52,199,150,0.4)', color: '#34c796', background: 'rgba(52,199,150,0.05)' }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: 'rgba(232,245,240,0.6)', fontFamily: 'inherit', fontWeight: 500, fontSize: 15, padding: '15px 28px', borderRadius: 100, border: '1px solid rgba(232,245,240,0.12)', cursor: 'pointer', transition: 'all 0.25s' }}>
                View Dashboard
              </motion.button>
            </Link>
          </motion.div>

          {/* Metrics */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {[['10K+', 'Sessions'], ['98%', 'Feel Better'], ['24/7', 'Available'], ['4.9★', 'Rated']].map(([num, label], i) => (
              <div key={label} style={{ paddingRight: 28, paddingLeft: i === 0 ? 0 : 28, borderLeft: i === 0 ? 'none' : '1px solid rgba(232,245,240,0.08)' }}>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 600, background: 'linear-gradient(135deg,#34c796,#7effd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.1 }}>{num}</p>
                <p style={{ fontSize: 12, color: 'rgba(232,245,240,0.35)', marginTop: 4, letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 500 }}>{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — Phone */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          {/* Glow ring */}
          <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(52,199,150,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />

          {/* Orbit */}
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', width: 380, height: 380, borderRadius: '50%', border: '1px dashed rgba(52,199,150,0.12)', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', width: 10, height: 10, background: 'linear-gradient(135deg,#34c796,#7effd4)', borderRadius: '50%', top: -5, left: '50%', transform: 'translateX(-50%)', boxShadow: '0 0 12px rgba(52,199,150,0.7)' }} />
          </motion.div>

          {/* Floating cards */}
          <motion.div animate={{ y: [0, -12, 0], rotate: [-2, 0, -2] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: 20, left: -70, background: 'rgba(20,35,28,0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(52,199,150,0.2)', borderRadius: 16, padding: '14px 18px', zIndex: 10, minWidth: 140 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#34c796,#2da87e)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(52,199,150,0.4)', marginBottom: 8 }}>
              <Smile size={20} color='#050c0a' strokeWidth={2} />
            </div>
            <p style={{ fontSize: 10, color: 'rgba(52,199,150,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Today's Mood</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#e8f5f0' }}>Happy</p>
            <p style={{ fontSize: 11, color: 'rgba(232,245,240,0.4)', marginTop: 2 }}>↑ Better than yesterday</p>
          </motion.div>

          <motion.div animate={{ y: [0, -10, 0], rotate: [2, 0, 2] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            style={{ position: 'absolute', bottom: 60, right: -60, background: 'rgba(20,35,28,0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(52,199,150,0.2)', borderRadius: 16, padding: '14px 18px', zIndex: 10 }}>
            <p style={{ fontSize: 10, color: 'rgba(52,199,150,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>7-Day Streak</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#34c796,#2da87e)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(52,199,150,0.4)' }}>
                <Leaf size={15} color='#050c0a' strokeWidth={2} />
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#e8f5f0' }}>14 days</p>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(232,245,240,0.4)', marginTop: 2 }}>Keep it up!</p>
          </motion.div>

          <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            style={{ position: 'absolute', top: 190, right: -80, background: 'rgba(20,35,28,0.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(52,199,150,0.2)', borderRadius: 16, padding: '14px 18px', zIndex: 10 }}>
            <p style={{ fontSize: 10, color: 'rgba(52,199,150,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Wellness</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#e8f5f0' }}>84 / 100</p>
          </motion.div>

          {/* Phone */}
          <motion.div animate={{ y: [0, -16, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 280, background: '#0d1f1a', borderRadius: 44, padding: 14, boxShadow: '0 40px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(52,199,150,0.1), inset 0 1px 0 rgba(255,255,255,0.04)', position: 'relative', zIndex: 5 }}>
            <div style={{ background: '#071410', borderRadius: 32, overflow: 'hidden', minHeight: 500, display: 'flex', flexDirection: 'column' }}>
              {/* Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 10px', borderBottom: '1px solid rgba(52,199,150,0.07)' }}>
                <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#34c796,#2da87e)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💚</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#e8f5f0' }}>EmoCare AI</p>
                  <p style={{ fontSize: 10, color: '#34c796', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <motion.span animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
                      style={{ width: 5, height: 5, background: '#34c796', borderRadius: '50%', display: 'inline-block' }} />
                    Online · Always here
                  </p>
                </div>
              </div>
              {/* Messages */}
              <div style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { ai: true, text: 'Hi there 💚 How are you feeling?', delay: 0 },
                  { ai: true, text: "I'm here — no judgment, just care.", delay: 0.3 },
                  { ai: false, text: "I've been overwhelmed lately...", delay: 0.6 },
                  { ai: true, text: "I hear you. Can you tell me what's been weighing on you most?", delay: 0.9 },
                  { ai: true, text: "You're not alone in this 🌿", delay: 1.2 },
                ].map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: m.delay, duration: 0.4 }}
                    style={{
                      alignSelf: m.ai ? 'flex-start' : 'flex-end', maxWidth: '88%',
                      padding: '9px 13px', fontSize: 12, lineHeight: 1.5,
                      borderRadius: m.ai ? '4px 18px 18px 18px' : '18px 18px 4px 18px',
                      background: m.ai ? 'rgba(52,199,150,0.12)' : 'linear-gradient(135deg,#34c796,#2da87e)',
                      border: m.ai ? '1px solid rgba(52,199,150,0.15)' : 'none',
                      color: m.ai ? '#d0f0e8' : '#050c0a', fontWeight: m.ai ? 400 : 500,
                    }}>
                    {m.text}
                  </motion.div>
                ))}
              </div>
              {/* Input */}
              <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(52,199,150,0.07)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, fontSize: 11, color: 'rgba(232,245,240,0.2)', background: 'rgba(52,199,150,0.06)', border: '1px solid rgba(52,199,150,0.1)', borderRadius: 20, padding: '7px 14px' }}>Share your feelings...</div>
                <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg,#34c796,#2da87e)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#050c0a' }}>➤</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ TRUST BAR ══ */}
      <div style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(52,199,150,0.07)', borderBottom: '1px solid rgba(52,199,150,0.07)', background: 'rgba(52,199,150,0.025)', padding: '24px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px', display: 'flex', justifyContent: 'center', gap: 56, flexWrap: 'wrap' }}>
          {TRUST.map(({ Icon, label, glow }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(232,245,240,0.5)', fontWeight: 500 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${glow?.replace('0.3', '0.12') || 'rgba(52,199,150,0.12)'}`, border: `1px solid ${glow?.replace('0.3', '0.25') || 'rgba(52,199,150,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 2px 8px ${glow || 'rgba(52,199,150,0.2)'}` }}>
                <Icon size={14} color='#34c796' strokeWidth={2} />
              </div>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ══ FEATURES ══ */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '120px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
          <div>
            <Reveal>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#34c796', marginBottom: 16 }}>
                <span style={{ width: 24, height: 1, background: '#34c796', display: 'inline-block' }} /> Features
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 50, fontWeight: 400, lineHeight: 1.1, color: '#e8f5f0', marginBottom: 16 }}>
                Everything you need<br />to <span style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#34c796,#7effd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>truly thrive</span>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p style={{ fontSize: 17, color: 'rgba(232,245,240,0.4)', lineHeight: 1.7, fontWeight: 300, maxWidth: 440, marginBottom: 48 }}>
                A complete emotional wellness toolkit, thoughtfully built to understand and support your mental health journey.
              </p>
            </Reveal>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={0.1 * i}>
                  <motion.div whileHover={{ background: 'rgba(52,199,150,0.07)' }}
                    onClick={() => setActiveTab(i)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 24px',
                      borderRadius: 16, cursor: 'pointer', transition: 'all 0.3s',
                      background: activeTab === i ? 'rgba(52,199,150,0.08)' : 'transparent',
                      border: activeTab === i ? '1px solid rgba(52,199,150,0.2)' : '1px solid transparent',
                    }}>
                    <PremiumIcon
                      icon={FEATURE_ICONS[i].Icon}
                      gradient={activeTab === i ? FEATURE_ICONS[i].gradient : 'rgba(52,199,150,0.08)'}
                      glow={activeTab === i ? FEATURE_ICONS[i].glow : 'transparent'}
                      boxSize={48} size={20} animate={false}
                      style={{ border: activeTab === i ? 'none' : '1px solid rgba(52,199,150,0.15)', transition: 'all 0.3s' }}
                    />
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 600, color: '#e8f5f0', marginBottom: 6 }}>{f.title}</p>
                      <p style={{ fontSize: 14, color: 'rgba(232,245,240,0.42)', lineHeight: 1.6, fontWeight: 300 }}>{f.desc}</p>
                    </div>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{ position: 'sticky', top: 100 }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
                <PreviewComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section style={{ position: 'relative', zIndex: 1, background: 'rgba(52,199,150,0.025)', borderTop: '1px solid rgba(52,199,150,0.07)', borderBottom: '1px solid rgba(52,199,150,0.07)', padding: '120px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 80 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#34c796', marginBottom: 16 }}>
                <span style={{ width: 24, height: 1, background: '#34c796', display: 'inline-block' }} /> Process <span style={{ width: 24, height: 1, background: '#34c796', display: 'inline-block' }} />
              </div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 50, fontWeight: 400, color: '#e8f5f0', marginBottom: 12 }}>How EmoCare works</h2>
              <p style={{ fontSize: 17, color: 'rgba(232,245,240,0.4)', fontWeight: 300 }}>Four simple steps to a healthier emotional life</p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, position: 'relative' }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', top: 40, left: '12.5%', right: '12.5%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(52,199,150,0.25), rgba(52,199,150,0.25), transparent)', pointerEvents: 'none' }} />

            {STEPS.map(({ num, title, desc }, i) => (
              <Reveal key={num} delay={i * 0.1}>
                <motion.div whileHover={{ y: -6 }} style={{ textAlign: 'center', padding: '0 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                    <motion.div whileHover={{ background: 'rgba(52,199,150,0.12)', borderColor: 'rgba(52,199,150,0.5)', boxShadow: '0 0 28px rgba(52,199,150,0.2)' }} transition={{ duration: 0.2 }}
                      style={{ width: 80, height: 80, background: 'rgba(15,28,22,0.9)', border: '1px solid rgba(52,199,150,0.22)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontSize: 26, color: '#34c796', transition: 'all 0.3s' }}>
                      {num}
                    </motion.div>
                  </div>
                  <p style={{ fontSize: 17, fontWeight: 600, color: '#e8f5f0', marginBottom: 10 }}>{title}</p>
                  <p style={{ fontSize: 14, color: 'rgba(232,245,240,0.38)', lineHeight: 1.65, fontWeight: 300 }}>{desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: 1280, margin: '0 auto', padding: '120px 48px' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#34c796', marginBottom: 16 }}>
              <span style={{ width: 24, height: 1, background: '#34c796', display: 'inline-block' }} /> Testimonials <span style={{ width: 24, height: 1, background: '#34c796', display: 'inline-block' }} />
            </div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 50, fontWeight: 400, color: '#e8f5f0' }}>
              Real stories, <span style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#34c796,#7effd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>real growth</span>
            </h2>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {TESTIMONIALS.map(({ stars, quote, name, role, initials, gradient }, i) => (
            <Reveal key={name} delay={i * 0.12}>
              <motion.div whileHover={{ y: -8, borderColor: 'rgba(52,199,150,0.28)', boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }} transition={{ duration: 0.25 }}
                style={{ background: 'rgba(15,28,22,0.6)', border: '1px solid rgba(52,199,150,0.1)', borderRadius: 20, padding: 28, cursor: 'default', transition: 'all 0.25s' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 16, alignItems: 'center' }}>
                  {Array.from({length: stars}).map((_, si) => (
                    <Star key={si} size={14} fill="#f59e0b" stroke="none" style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.5))' }} />
                  ))}
                </div>
                <p style={{ fontSize: 15, color: 'rgba(232,245,240,0.65)', lineHeight: 1.7, marginBottom: 24, fontStyle: 'italic', fontWeight: 300 }}>{quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <AvatarIcon initials={initials} size={42} gradient={gradient} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#e8f5f0' }}>{name}</p>
                    <p style={{ fontSize: 12, color: 'rgba(232,245,240,0.33)' }}>{role}</p>
                  </div>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 48px 120px' }}>
        <Reveal>
          <div style={{
            maxWidth: 1000, margin: '0 auto', textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(52,199,150,0.13) 0%, rgba(15,28,22,0.8) 50%, rgba(45,168,126,0.08) 100%)',
            border: '1px solid rgba(52,199,150,0.22)', borderRadius: 32, padding: 80, position: 'relative', overflow: 'hidden',
          }}>
            <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 8, repeat: Infinity }}
              style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(52,199,150,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#34c796', marginBottom: 20 }}>
                <span style={{ width: 24, height: 1, background: '#34c796', display: 'inline-block' }} /> Get Started Free <span style={{ width: 24, height: 1, background: '#34c796', display: 'inline-block' }} />
              </div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 52, fontWeight: 400, color: '#e8f5f0', marginBottom: 16, lineHeight: 1.1 }}>
                Your emotional wellness<br />journey starts <span style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#34c796,#7effd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>today</span>
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(232,245,240,0.45)', marginBottom: 48, fontWeight: 300 }}>
                Join thousands who've discovered a healthier, happier relationship with their emotions.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
                <Link to={user ? '/chat' : '/login'}>
                  <motion.button whileHover={{ scale: 1.04, y: -3, boxShadow: '0 0 60px rgba(52,199,150,0.55)' }} whileTap={{ scale: 0.97 }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#34c796,#2da87e)', color: '#050c0a', fontFamily: 'inherit', fontWeight: 600, fontSize: 16, padding: '16px 36px', borderRadius: 100, border: 'none', cursor: 'pointer', boxShadow: '0 0 40px rgba(52,199,150,0.3)' }}>
                    Begin Your Journey <span>→</span>
                  </motion.button>
                </Link>
                <Link to="/journal">
                  <motion.button whileHover={{ borderColor: 'rgba(52,199,150,0.4)', color: '#34c796' }}
                    style={{ background: 'transparent', color: 'rgba(232,245,240,0.6)', fontFamily: 'inherit', fontWeight: 500, fontSize: 15, padding: '15px 28px', borderRadius: 100, border: '1px solid rgba(232,245,240,0.12)', cursor: 'pointer', transition: 'all 0.25s' }}>
                    Start Journaling
                  </motion.button>
                </Link>
              </div>
              <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(232,245,240,0.28)' }}>
                <span style={{display:'inline-flex',alignItems:'center',gap:4,flexWrap:'wrap',justifyContent:'center'}}>
                  <CheckCircle2 size={12} color='#34c796' strokeWidth={2}/> Free to use
                  &nbsp;&nbsp;
                  <CheckCircle2 size={12} color='#34c796' strokeWidth={2}/> Private &amp; secure
                  &nbsp;&nbsp;
                  <CheckCircle2 size={12} color='#34c796' strokeWidth={2}/> No judgment, ever
                </span>
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(52,199,150,0.07)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 48px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap', gap: 40 }}>
            <div style={{ maxWidth: 280 }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 12 }}>
                <img src="/emocare_logo_new.png" alt="EmoCare" onError={e => e.target.style.display = 'none'}
                  style={{ width: 32, height: 32, borderRadius: 9, objectFit: 'cover', border: '1px solid rgba(52,199,150,0.22)' }} />
                <span style={{ fontWeight: 700, fontSize: 19, background: 'linear-gradient(135deg,#34c796,#7effd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EmoCare</span>
              </Link>
              <p style={{ fontSize: 14, color: 'rgba(232,245,240,0.32)', lineHeight: 1.7, fontWeight: 300 }}>
                Your compassionate AI companion for emotional wellness — always available, always caring, always private.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 60 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(232,245,240,0.35)', marginBottom: 16 }}>App</p>
                {[['Chat with AI', '/chat'], ['Dashboard', '/dashboard'], ['Journal', '/journal'], ['Breathe', '/breathe']].map(([l, p]) => (
                  <Link key={l} to={p} style={{ display: 'block', fontSize: 14, color: 'rgba(232,245,240,0.45)', textDecoration: 'none', marginBottom: 10, fontWeight: 300, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#34c796'} onMouseLeave={e => e.target.style.color = 'rgba(232,245,240,0.45)'}>
                    {l}
                  </Link>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(232,245,240,0.35)', marginBottom: 16 }}>Wellness</p>
                {[['Mood Tracker', '/moods'], ['Soundscapes', '/soundscapes'], ['Affirmations', '/affirmations'], ['Achievements', '/achievements']].map(([l, p]) => (
                  <Link key={l} to={p} style={{ display: 'block', fontSize: 14, color: 'rgba(232,245,240,0.45)', textDecoration: 'none', marginBottom: 10, fontWeight: 300, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#34c796'} onMouseLeave={e => e.target.style.color = 'rgba(232,245,240,0.45)'}>
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(232,245,240,0.05)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 13, color: 'rgba(232,245,240,0.18)', fontWeight: 300, display:'flex', alignItems:'center', gap:4 }}>
              © 2024 EmoCare. Built with <Heart size={12} fill='#34c796' color='#34c796'/> for your wellbeing.
            </p>
            <p style={{ fontSize: 12, color: 'rgba(232,245,240,0.18)', maxWidth: 380, textAlign: 'right', fontWeight: 300, display:'flex', alignItems:'flex-start', gap:4 }}>
              <Shield size={12} color='rgba(232,245,240,0.3)' style={{flexShrink:0,marginTop:1}}/>
              If you're in crisis, please contact a mental health professional or call a crisis helpline immediately.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
