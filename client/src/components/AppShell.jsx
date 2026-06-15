import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, BookOpen, BarChart2, Wind, User, LogOut,
  ChevronLeft, ChevronRight, Wifi, Menu, X, Heart, Smile,
  Trophy, Droplets, Star, History, AlertTriangle, Mic, Calendar, Headphones
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AmbientBackground from './AmbientBackground';

const NAV = [
  { icon: BarChart2,     label: 'Dashboard',   path: '/dashboard',    group: 'main'    },
  { icon: MessageCircle, label: 'Chat',         path: '/chat',         group: 'main'    },
  { icon: Mic,           label: 'Voice Mode',   path: '/voice',        group: 'main'    },
  { icon: History,       label: 'History',      path: '/history',      group: 'main'    },
  { icon: BookOpen,      label: 'Journal',      path: '/journal',      group: 'main'    },
  { icon: Calendar,      label: 'Therapy',      path: '/therapy',      group: 'main'    },
  { icon: Smile,         label: 'Moods',        path: '/moods',        group: 'tools'   },
  { icon: Wind,          label: 'Breathe',      path: '/breathe',      group: 'tools'   },
  { icon: Droplets,      label: 'Wellness',     path: '/wellness',     group: 'tools'   },
  { icon: Star,          label: 'Affirmations', path: '/affirmations', group: 'tools'   },
  { icon: Headphones,    label: 'Soundscapes',  path: '/soundscapes',  group: 'tools'   },
  { icon: Trophy,        label: 'Achievements', path: '/achievements', group: 'tools'   },
  { icon: AlertTriangle, label: 'Crisis Help',  path: '/crisis',       group: 'crisis'  },
  { icon: User,          label: 'Profile',      path: '/profile',      group: 'account' },
];

const SIDEBAR_BG    = 'rgba(7, 20, 16, 0.92)';
const SIDEBAR_BORDER = 'rgba(52, 199, 150, 0.10)';
const ACCENT        = '#34c796';
const ACCENT_GLOW   = 'rgba(52, 199, 150, 0.15)';

export default function AppShell() {
  const { user, logout }              = useAuth();
  const navigate                      = useNavigate();
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden', display: 'flex', background: '#050c0a' }}>

      {/* 🌱 Ambient background (slow breathing animations) 🌱 */}
      <AmbientBackground />

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 30, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* ══ SIDEBAR ══ */}
      <motion.aside
        layout
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'relative', zIndex: 40, display: 'flex', flexDirection: 'column',
          height: '100%', flexShrink: 0, overflow: 'hidden',
          background: SIDEBAR_BG,
          borderRight: `1px solid ${SIDEBAR_BORDER}`,
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* ── Logo ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px', borderBottom: `1px solid ${SIDEBAR_BORDER}`, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(52,199,150,0.25)', background: 'rgba(52,199,150,0.08)' }}>
            <img src="/emologo_new.png" alt="EmoCare" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:16px">💚</span>'; }} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
                <p style={{ fontWeight: 700, fontSize: 16, background: 'linear-gradient(135deg,#34c796,#7effd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.2px', lineHeight: 1 }}>
                  EmoCare
                </p>
                <p style={{ fontSize: 10, color: 'rgba(232,245,240,0.35)', marginTop: 2 }}>AI Wellness</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Nav ── */}
        <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
          {/* Main group */}
          {!collapsed && (
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(232,245,240,0.25)', padding: '0 12px', marginBottom: 6, marginTop: 4 }}>
              Main
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
            {NAV.filter(n => n.group === 'main').map(({ icon: Icon, label, path }) => (
              <NavItem key={path} Icon={Icon} label={label} path={path} collapsed={collapsed} setMobileOpen={setMobileOpen} />
            ))}
          </div>

          {/* Tools group */}
          {!collapsed && (
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(232,245,240,0.25)', padding: '0 12px', marginBottom: 6, marginTop: 8 }}>
              Wellness Tools
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 12 }}>
            {NAV.filter(n => n.group === 'tools').map(({ icon: Icon, label, path }) => (
              <NavItem key={path} Icon={Icon} label={label} path={path} collapsed={collapsed} setMobileOpen={setMobileOpen} />
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(52,199,150,0.08)', margin: '8px 12px 12px' }} />

          {/* Crisis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 4 }}>
            {NAV.filter(n => n.group === 'crisis').map(({ icon: Icon, label, path }) => (
              <NavItem key={path} Icon={Icon} label={label} path={path} collapsed={collapsed} setMobileOpen={setMobileOpen} crisis />
            ))}
          </div>

          {/* Account */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.filter(n => n.group === 'account').map(({ icon: Icon, label, path }) => (
              <NavItem key={path} Icon={Icon} label={label} path={path} collapsed={collapsed} setMobileOpen={setMobileOpen} />
            ))}
          </div>
        </nav>

        {/* ── User capsule ── */}
        <div style={{ flexShrink: 0, borderTop: `1px solid ${SIDEBAR_BORDER}`, padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #34c796, #2da87e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#050c0a' }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: '#34c796', border: '2px solid #050c0a' }} />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#e8f5f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.name || 'User'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Wifi size={9} color={ACCENT} />
                    <p style={{ fontSize: 10, color: 'rgba(232,245,240,0.3)' }}>Synced</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!collapsed && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={handleLogout}
                  style={{ padding: '6px', borderRadius: 8, background: 'transparent', border: 'none', color: 'rgba(232,245,240,0.3)', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.background = 'rgba(255,107,107,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(232,245,240,0.3)'; e.currentTarget.style.background = 'transparent'; }}
                  title="Logout">
                  <LogOut size={13} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapse toggle */}
        <motion.button
          onClick={() => setCollapsed(c => !c)}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%', background: '#0d1f1a', border: '1px solid rgba(52,199,150,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(232,245,240,0.5)', zIndex: 50, cursor: 'pointer' }}>
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </motion.button>
      </motion.aside>

      {/* ══ MAIN CONTENT ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative', zIndex: 10 }}>
        {/* Mobile header */}
        <div style={{ display: 'none', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${SIDEBAR_BORDER}`, flexShrink: 0, background: SIDEBAR_BG, backdropFilter: 'blur(12px)' }}
          className="mobile-header">
          <button onClick={() => setMobileOpen(o => !o)} style={{ padding: '6px', borderRadius: 8, background: 'transparent', border: 'none', color: 'rgba(232,245,240,0.5)', cursor: 'pointer' }}>
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/emologo_new.png" alt="EmoCare" style={{ width: 24, height: 24, borderRadius: 7, objectFit: 'cover', border: '1px solid rgba(52,199,150,0.2)' }} onError={e => e.target.style.display = 'none'} />
            <span style={{ fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg,#34c796,#7effd4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EmoCare</span>
          </div>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(5,12,10,0.6)', backdropFilter: 'blur(20px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/* ── Nav Item ── */
function NavItem({ Icon, label, path, collapsed, setMobileOpen, crisis }) {
  return (
    <NavLink to={path} onClick={() => setMobileOpen(false)}
      style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <div style={{ position: 'relative' }}>
          {isActive && !crisis && (
            <motion.div layoutId="active-nav"
              style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'rgba(52,199,150,0.12)', border: '1px solid rgba(52,199,150,0.22)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 12, position: 'relative', cursor: 'pointer',
            color: crisis
              ? isActive ? '#ff8a8a' : 'rgba(255,138,138,0.45)'
              : isActive ? '#e8f5f0' : 'rgba(232,245,240,0.45)',
            background: crisis && isActive ? 'rgba(255,100,100,0.08)' : 'transparent',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(52,199,150,0.06)'; e.currentTarget.style.color = crisis ? '#ff8a8a' : '#e8f5f0'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = crisis ? (isActive ? '#ff8a8a' : 'rgba(255,138,138,0.45)') : (isActive ? '#e8f5f0' : 'rgba(232,245,240,0.45)'); }}>
            <Icon size={16} style={{ flexShrink: 0, position: 'relative', zIndex: 1 }} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ fontSize: 13, fontWeight: 500, position: 'relative', zIndex: 1, whiteSpace: 'nowrap' }}>
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
            {/* Tooltip when collapsed */}
            {collapsed && (
              <div style={{ position: 'absolute', left: '100%', marginLeft: 12, padding: '4px 10px', background: '#0d1f1a', border: '1px solid rgba(52,199,150,0.2)', color: '#e8f5f0', fontSize: 12, borderRadius: 8, opacity: 0, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 50, transition: 'opacity 0.15s' }}
                className="nav-tooltip">
                {label}
              </div>
            )}
          </div>
        </div>
      )}
    </NavLink>
  );
}
