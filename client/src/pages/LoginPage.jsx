import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CalmingQuantumBackground from '../components/CalmingQuantumBackground';
import { setAuth } from '../api';

const GOOGLE_CLIENT_ID = '979550335571-bp4a4da94668htms2jtc4ntg5qbqrgb2.apps.googleusercontent.com';

export default function LoginPage() {
  const [tab, setTab]         = useState('login');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });

  const googleBtnRef = useRef(null);
  const { login, signup }   = useAuth();
  const navigate = useNavigate();

  // Load Google GSI script and render button
  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          width: googleBtnRef.current.offsetWidth || 340,
          text: tab === 'login' ? 'signin_with' : 'signup_with',
        });
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }
  }, [tab]);

  const handleGoogleResponse = async (response) => {
    setGLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google sign-in failed');
      setAuth(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGLoading(false);
    }
  };

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (tab === 'signup') {
      if (!form.name || !form.email || !form.password) return setError('Please fill all fields.');
      if (form.password.length < 6) return setError('Password must be at least 6 characters.');
      if (form.password !== form.confirm) return setError('Passwords do not match.');
    } else {
      if (!form.email || !form.password) return setError('Please fill all fields.');
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen overflow-auto bg-zinc-950 flex">
      <CalmingQuantumBackground />

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 relative z-10 p-10 border-r"
        style={{ background: 'rgba(7,20,16,0.85)', backdropFilter: 'blur(20px)', borderColor: 'rgba(52,199,150,0.10)' }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 36, height: 36, borderRadius: 11, overflow: 'hidden', border: '1px solid rgba(52,199,150,0.25)', background: 'rgba(52,199,150,0.08)' }}>
            <img src="/emologo_new.png" alt="EmoCare" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, background: 'linear-gradient(135deg,#34c796,#7effd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EmoCare</span>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              Your <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#34c796,#7effd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>wellbeing</em><br />starts here.
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              A private, non-judgmental space powered by AI to help you understand and grow through your emotions.
            </p>
          </div>

          {/* Trust badges */}
          <div className="space-y-3">
            {[
              'End-to-end encrypted conversations',
              'No data sold, ever',
              'Evidence-based emotional support',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <p className="text-xs text-zinc-400">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <blockquote style={{ borderLeft: '2px solid rgba(52,199,150,0.25)', paddingLeft: 16 }}>
          <p className="text-sm text-zinc-500 italic leading-relaxed">
            "The greatest thing in the world is to know how to belong to oneself."
          </p>
          <p className="text-xs text-zinc-700 mt-2">— Michel de Montaigne</p>
        </blockquote>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 relative z-10 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div style={{ width: 32, height: 32, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(52,199,150,0.22)' }}>
              <img src="/emologo_new.png" alt="EmoCare" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
            </div>
            <span style={{ fontWeight: 700, background: 'linear-gradient(135deg,#34c796,#7effd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EmoCare</span>
          </div>

          {/* Card */}
          <div className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(13,31,26,0.92)',
              border: '1px solid rgba(52,199,150,0.12)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(52,199,150,0.05)',
            }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <p style={{ fontSize: 11, fontWeight: 600, color: '#34c796', marginBottom: 4 }}>
                {tab === 'login' ? 'Welcome back' : 'Get started for free'}
              </p>
              <h1 className="text-xl font-semibold text-white">
                {tab === 'login' ? 'Sign in to EmoCare' : 'Create your account'}
              </h1>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 px-6">
              {[['login', 'Sign In'], ['signup', 'Sign Up']].map(([t, label]) => (
                <button key={t} onClick={() => { setTab(t); setError(''); }}
                  className={`pb-3 mr-4 text-sm font-medium transition-colors relative ${
                    tab === t ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}>
                  {label}
                  {tab === t && (
                    <motion.div layoutId="tab-line"
                      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #34c796, #2da87e)' }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-3">
              {/* Google Sign-In button */}
              <div className="relative">
                {gLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 rounded-xl z-10">
                    <Loader2 size={16} className="animate-spin" style={{ color: '#34c796' }} />
                  </div>
                )}
                <div ref={googleBtnRef} className="w-full min-h-[44px] flex items-center justify-center" />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[11px] text-zinc-600">or continue with email</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <AnimatePresence mode="wait">
                  {tab === 'signup' && (
                    <motion.div key="name-field"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <InputField icon={<User size={13} />} placeholder="Full name"
                        value={form.name} onChange={set('name')} type="text" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <InputField icon={<Mail size={13} />} placeholder="Email address"
                  value={form.email} onChange={set('email')} type="email" />

                <InputField icon={<Lock size={13} />} placeholder="Password"
                  value={form.password} onChange={set('password')}
                  type={showPw ? 'text' : 'password'}
                  right={
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="text-zinc-600 hover:text-zinc-400 transition-colors">
                      {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  }
                />

                <AnimatePresence mode="wait">
                  {tab === 'signup' && (
                    <motion.div key="confirm-field"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <InputField icon={<Lock size={13} />} placeholder="Confirm password"
                        value={form.confirm} onChange={set('confirm')} type="password" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs text-rose-400 border border-rose-500/20"
                      style={{ background: 'rgba(239,68,68,0.08)' }}>
                      ⚠️ {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #34c796, #2da87e)',
                    boxShadow: '0 4px 20px rgba(52,199,150,0.3)',
                    opacity: loading ? 0.75 : 1,
                  }}>
                  {loading
                    ? <Loader2 size={15} className="animate-spin" />
                    : <>{tab === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={14} /></>
                  }
                </motion.button>
              </form>
            </div>

            <div className="px-6 pb-5 text-center">
              <p className="text-[11px] text-zinc-700">🔒 Your data is private and never shared</p>
            </div>
          </div>

          <p className="text-center mt-4 text-xs text-zinc-700">
            <Link to="/" className="hover:text-zinc-400 transition-colors">← Back to home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function InputField({ icon, placeholder, value, onChange, type = 'text', right }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-colors"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <span className="text-zinc-600 flex-shrink-0">{icon}</span>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'name'}
      />
      {right}
    </div>
  );
}
