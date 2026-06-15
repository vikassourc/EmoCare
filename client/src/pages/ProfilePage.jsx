import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Trash2, Shield, Loader2, CheckCircle, Heart, Leaf, Brain, Wind, Sun, Sparkles, Flower2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api, clearAuth } from '../api';
import { useNavigate } from 'react-router-dom';

const AVATAR_OPTIONS = [
  { id: 'heart_g', Icon: Heart, color: '#10b981', fill: '#10b981' },
  { id: 'leaf', Icon: Leaf, color: '#34d399', fill: 'none' },
  { id: 'brain', Icon: Brain, color: '#a78bfa', fill: 'none' },
  { id: 'heart_p', Icon: Heart, color: '#c084fc', fill: '#c084fc' },
  { id: 'wind', Icon: Wind, color: '#38bdf8', fill: 'none' },
  { id: 'sun', Icon: Sun, color: '#fcd34d', fill: '#fcd34d' },
  { id: 'sparkles', Icon: Sparkles, color: '#60a5fa', fill: '#60a5fa' },
  { id: 'flower', Icon: Flower2, color: '#f472b6', fill: 'none' },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName]         = useState(user?.name || '');
  const [avatar, setAvatar]     = useState(user?.avatar || 'heart_g');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const [oldPw, setOldPw]       = useState('');
  const [newPw, setNewPw]       = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg]       = useState('');

  const [showDelete, setShowDelete] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ name, avatar });
      localStorage.setItem('emocare_user', JSON.stringify({ ...user, name, avatar }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {} finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!oldPw || !newPw) return setPwMsg('Please fill all fields.');
    if (newPw.length < 6) return setPwMsg('New password must be at least 6 characters.');
    if (newPw !== confirmPw) return setPwMsg('Passwords do not match.');
    setPwLoading(true); setPwMsg('');
    try {
      await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('emocare_token')}` },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      setPwMsg('✅ Password updated successfully!');
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch { setPwMsg('Failed to update password.'); } finally { setPwLoading(false); }
  };

  const deleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await fetch('/api/auth/account', { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('emocare_token')}` } });
      logout();
      navigate('/');
    } catch {} finally { setDeleteLoading(false); }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-semibold text-white">Profile & Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your account and preferences.</p>
      </div>

      {/* Profile Card */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        className="rounded-2xl p-6 flex items-center gap-5"
        style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center border border-indigo-500/20">
          {(() => {
            const A = AVATAR_OPTIONS.find(a => a.id === (user?.avatar || avatar)) || AVATAR_OPTIONS[0];
            return <A.Icon size={32} color={A.color} fill={A.fill} />;
          })()}
        </div>
        <div>
          <p className="text-lg font-semibold text-white">{user?.name}</p>
          <p className="text-sm text-zinc-500">{user?.email}</p>
          <p className="text-xs text-zinc-600 mt-1">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month:'long', year:'numeric' }) : '—'}</p>
        </div>
      </motion.div>

      {/* Settings */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
        className="rounded-2xl p-5 space-y-5"
        style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
          <User size={14} className="text-zinc-500" />
          <p className="text-sm font-semibold text-white">Profile Settings</p>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs text-zinc-500 mb-2 block">Display Name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-zinc-200 bg-white/5 border border-white/7 outline-none focus:border-indigo-500/40 transition-colors"
            placeholder="Your name" />
        </div>

        {/* Theme */}
        <div>
          <label className="text-xs text-zinc-500 mb-2 block">App Theme</label>
          <div className="flex flex-wrap gap-3">
            {[
              { id:'zinc',   label:'Zinc',   color:'bg-zinc-900',  border:'border-zinc-500' },
              { id:'ocean',  label:'Ocean',  color:'bg-slate-900', border:'border-sky-400' },
              { id:'forest', label:'Forest', color:'bg-green-950', border:'border-emerald-400' },
              { id:'sunset', label:'Sunset', color:'bg-red-950',   border:'border-rose-400' },
            ].map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium border transition-all ${
                  theme === t.id ? `bg-white/10 ${t.border} text-white` : 'border-white/5 text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                }`}>
                <div className={`w-3 h-3 rounded-full ${t.color} border border-white/20`} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Avatar */}
        <div>
          <label className="text-xs text-zinc-500 mb-2 block">Avatar</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_OPTIONS.map(a => (
              <button key={a.id} onClick={() => setAvatar(a.id)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${
                  avatar === a.id ? 'bg-indigo-500/20 border-indigo-500/40' : 'bg-white/5 border-white/5 hover:bg-white/8'
                }`}>
                <a.Icon size={20} color={a.color} fill={a.fill} />
              </button>
            ))}
          </div>
        </div>

        <motion.button onClick={saveProfile} disabled={saving}
          whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background:'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow:'0 4px 16px rgba(99,102,241,0.25)' }}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <CheckCircle size={13} /> : null}
          {saved ? 'Saved!' : 'Save Changes'}
        </motion.button>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="rounded-2xl p-5 space-y-4"
        style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
          <Lock size={14} className="text-zinc-500" />
          <p className="text-sm font-semibold text-white">Change Password</p>
        </div>

        {[['Current Password', oldPw, setOldPw], ['New Password', newPw, setNewPw], ['Confirm New Password', confirmPw, setConfirmPw]].map(([label, val, setter]) => (
          <div key={label}>
            <label className="text-xs text-zinc-500 mb-1.5 block">{label}</label>
            <input type="password" value={val} onChange={e => setter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm text-zinc-200 bg-white/5 border border-white/7 outline-none focus:border-indigo-500/40 transition-colors"
              placeholder="••••••••" />
          </div>
        ))}

        {pwMsg && <p className={`text-xs ${pwMsg.startsWith('✅') ? 'text-emerald-400' : 'text-rose-400'}`}>{pwMsg}</p>}

        <button onClick={changePassword} disabled={pwLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-zinc-300 hover:bg-white/8 border border-white/5 transition-colors">
          {pwLoading && <Loader2 size={13} className="animate-spin" />}
          Update Password
        </button>
      </motion.div>

      {/* Trusted Circle */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}
        className="rounded-2xl p-5 space-y-4"
        style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-zinc-500" />
            <p className="text-sm font-semibold text-white">Trusted Circle (SOS)</p>
          </div>
          <p className="text-[10px] text-zinc-500">{user?.trustedContacts?.length || 0}/3 added</p>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Add up to 3 trusted contacts. If you trigger an SOS from the Crisis page, they will be notified automatically.
        </p>
        
        <div className="space-y-3">
          {(user?.trustedContacts || []).map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-sm font-medium text-white">{c.name}</p>
                <p className="text-xs text-zinc-500">{c.phone} {c.email ? `• ${c.email}` : ''}</p>
              </div>
              <button onClick={async () => {
                const newContacts = user.trustedContacts.filter((_, idx) => idx !== i);
                try {
                  const res = await api.updateContacts({ contacts: newContacts });
                  localStorage.setItem('emocare_user', JSON.stringify({ ...user, trustedContacts: res.user.trustedContacts }));
                  window.location.reload(); // naive reload to refresh context
                } catch (err) { alert('Failed to remove contact'); }
              }} className="text-zinc-600 hover:text-rose-400 p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {(!user?.trustedContacts || user.trustedContacts.length < 3) && (
            <button onClick={() => {
              const name = window.prompt("Contact Name:");
              if (!name) return;
              const phone = window.prompt("Contact Phone Number:");
              if (!phone) return;
              const email = window.prompt("Contact Email (optional):");
              
              const newContacts = [...(user?.trustedContacts || []), { name, phone, email }];
              api.updateContacts({ contacts: newContacts })
                .then(res => {
                  localStorage.setItem('emocare_user', JSON.stringify({ ...user, trustedContacts: res.user.trustedContacts }));
                  window.location.reload();
                })
                .catch(() => alert('Failed to add contact'));
            }} className="w-full py-3 rounded-xl border border-dashed border-white/10 text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 transition-colors">
              + Add New Contact
            </button>
          )}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
        className="rounded-2xl p-5 space-y-3"
        style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(239,68,68,0.15)' }}>
        <div className="flex items-center gap-2 pb-3 border-b border-white/5">
          <Shield size={14} className="text-rose-500" />
          <p className="text-sm font-semibold text-white">Danger Zone</p>
        </div>
        <p className="text-xs text-zinc-500">Deleting your account is permanent and cannot be undone.</p>
        <button onClick={() => setShowDelete(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 transition-colors">
          <Trash2 size={12} /> Delete Account
        </button>
      </motion.div>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDelete && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ backdropFilter:'blur(12px)', background:'rgba(0,0,0,0.6)' }}
            onClick={() => setShowDelete(false)}>
            <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0.9, opacity:0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl p-6 space-y-4"
              style={{ background:'rgba(20,20,24,0.95)', border:'1px solid rgba(239,68,68,0.2)' }}>
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
                <Trash2 size={16} className="text-rose-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Delete Account?</p>
                <p className="text-xs text-zinc-500 mt-1">This will permanently delete all your sessions, journal entries, and mood history. This cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDelete(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium text-zinc-400 bg-white/5 border border-white/5">Cancel</button>
                <button onClick={deleteAccount} disabled={deleteLoading}
                  className="flex-1 py-2 rounded-xl text-xs font-medium text-white bg-rose-500/80 hover:bg-rose-500 transition-colors">
                  {deleteLoading ? <Loader2 size={13} className="animate-spin mx-auto" /> : 'Delete Forever'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
