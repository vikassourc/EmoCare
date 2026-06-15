import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, Globe, Heart, Copy, Check, Shield, AlertTriangle, Leaf, Activity, Brain, Wind, Droplets, Footprints, BookOpen } from 'lucide-react';

import { api } from '../api';

const HELPLINES = [
  { name:'iCall', org:'TISS Mumbai', number:'9152987821', type:'Call', Icon:Phone, color:'from-indigo-500/20 to-indigo-500/5', border:'border-indigo-500/20', tag:'Counselling', hours:'Mon–Sat 8am–10pm' },
  { name:'Vandrevala Foundation', org:'24/7 Helpline', number:'1860-2662-345', type:'Call', Icon:Heart, color:'from-emerald-500/20 to-emerald-500/5', border:'border-emerald-500/20', tag:'Free', hours:'24 / 7' },
  { name:'AASRA', org:'Crisis Helpline', number:'9820466627', type:'Call', Icon:AlertTriangle, color:'from-rose-500/20 to-rose-500/5', border:'border-rose-500/20', tag:'Crisis', hours:'24 / 7' },
  { name:'Snehi', org:'Emotional Support', number:'044-24640050', type:'Call', Icon:Leaf, color:'from-teal-500/20 to-teal-500/5', border:'border-teal-500/20', tag:'Support', hours:'24 / 7' },
  { name:'Fortis Stress Helpline', org:'Fortis Healthcare', number:'8376804102', type:'Call', Icon:Activity, color:'from-blue-500/20 to-blue-500/5', border:'border-blue-500/20', tag:'Medical', hours:'Mon–Sat 9am–5pm' },
  { name:'NIMHANS', org:'National Institute', number:'080-46110007', type:'Call', Icon:Brain, color:'from-violet-500/20 to-violet-500/5', border:'border-violet-500/20', tag:'Psychiatry', hours:'Mon–Fri 9am–5pm' },
];

const SELF_HELP = [
  { Icon:Wind, title:'Breathe', desc:'Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Repeat 4 times.', action:'Try it', link:'/breathe' },
  { Icon:Globe, title:'Ground Yourself', desc:'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.', action:null },
  { Icon:Droplets, title:'Drink Water', desc:'Dehydration worsens anxiety. Drink a full glass of cold water slowly.', action:null },
  { Icon:Phone, title:'Call Someone', desc:"Tell one trusted person how you're feeling right now. You don't have to go through this alone.", action:null },
  { Icon:BookOpen, title:'Write it out', desc:"Open your journal and write exactly what you're feeling without filtering.", action:'Journal', link:'/journal' },
  { Icon:Footprints, title:'Move your body', desc:'A 5-minute walk, stretching, or even standing up can shift your mental state.', action:null },
];

const SAFE_PLAN = [
  { step:'1', title:'Warning Signs', desc:'What thoughts, images, moods, or situations come before a crisis for you?', example:'e.g., "I feel completely numb and start isolating"' },
  { step:'2', title:'Internal Coping', desc:'Things you can do on your own to distract or calm yourself without contacting anyone.', example:'e.g., "Go for a walk, listen to music, breathe"' },
  { step:'3', title:'People & Places', desc:'People or social settings that provide distraction from crisis.', example:'e.g., "Call my friend Priya, go to a café"' },
  { step:'4', title:'People to Ask for Help', desc:'Name and contact for people you can reach out to when struggling.', example:'e.g., "Mom: 98XXXXXXXX"' },
  { step:'5', title:'Professionals to Contact', desc:'Mental health professionals, crisis lines, emergency services.', example:'iCall: 9152987821' },
];

export default function CrisisPage() {
  const [copied, setCopied] = useState(null);
  const [sosStatus, setSosStatus] = useState('idle'); // idle, sending, sent, error

  const copyNumber = async (num, id) => {
    await navigator.clipboard.writeText(num);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSOS = async () => {
    if (!window.confirm("Are you sure you want to send an SOS alert to your Trusted Circle?")) return;
    setSosStatus('sending');
    try {
      await api.sendSOS();
      setSosStatus('sent');
      setTimeout(() => setSosStatus('idle'), 5000);
    } catch (err) {
      alert(err.message || 'Failed to send SOS. Please call emergency services directly.');
      setSosStatus('error');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* SOS Button Banner */}
      <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
        className="rounded-2xl p-6 text-center relative overflow-hidden"
        style={{ background:'linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))', border:'1px solid rgba(239,68,68,0.25)' }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.15),transparent_70%)]" />
        <div className="relative z-10">
          <AlertTriangle size={32} className="mx-auto mb-3 text-rose-400" />
          <h2 className="text-xl font-bold text-white mb-2">Are you in immediate danger?</h2>
          <p className="text-sm text-zinc-300 mb-5 max-w-md mx-auto">
            If you need immediate help, press the SOS button to alert your Trusted Circle, or call emergency services (112).
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSOS}
            disabled={sosStatus === 'sending' || sosStatus === 'sent'}
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-lg font-bold text-white shadow-lg transition-all"
            style={{ 
              background: sosStatus === 'sent' ? '#10b981' : 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: sosStatus === 'sent' ? '0 0 20px rgba(16,185,129,0.3)' : '0 10px 25px -5px rgba(239,68,68,0.5)',
            }}>
            {sosStatus === 'idle' || sosStatus === 'error' ? 'SEND SOS ALERT' : sosStatus === 'sending' ? 'SENDING ALERTS...' : '✓ ALERTS SENT'}
          </motion.button>
          {sosStatus === 'error' && <p className="text-rose-400 text-xs mt-3 font-medium">Failed to send. Have you added contacts in your Profile?</p>}
        </div>
      </motion.div>

      <div>
        <h1 className="text-2xl font-semibold text-white">Crisis Resources</h1>
        <p className="text-sm text-zinc-500 mt-1">You're not alone. Real people are ready to listen and help.</p>
      </div>

      {/* Helplines */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Phone size={14} className="text-zinc-500" />
          <p className="text-sm font-medium text-zinc-400">Crisis Helplines — India</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HELPLINES.map((h, i) => (
            <motion.div key={h.name} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-2xl bg-gradient-to-br ${h.color} border ${h.border}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-base"><h.Icon size={16} /></span>
                    <p className="text-sm font-semibold text-white">{h.name}</p>
                  </div>
                  <p className="text-[11px] text-zinc-500">{h.org}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-zinc-500">{h.tag}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-base font-bold text-white">{h.number}</p>
                  <p className="text-[10px] text-zinc-600">⏰ {h.hours}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${h.number.replace(/\D/g,'')}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-colors">
                    <Phone size={11} /> Call
                  </a>
                  <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    onClick={() => copyNumber(h.number, h.name)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white bg-white/5 border border-white/5 transition-colors">
                    {copied === h.name ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right now steps */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-zinc-500" />
          <p className="text-sm font-medium text-zinc-400">What to do right now</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SELF_HELP.map(({ Icon, title, desc, action, link }, i) => (
            <motion.div key={title} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl"
              style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="mb-2"><Icon size={24} className="text-indigo-400" /></div>
              <p className="text-sm font-semibold text-white mb-1">{title}</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">{desc}</p>
              {action && link && (
                <a href={link} className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  {action} →
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Safety plan */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Heart size={14} className="text-zinc-500" />
          <p className="text-sm font-medium text-zinc-400">Personal Safety Plan</p>
          <span className="text-[10px] text-zinc-700">· saved in your browser</span>
        </div>
        <div className="space-y-3">
          {SAFE_PLAN.map(({ step, title, desc, example }, i) => (
            <motion.div key={step} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-4"
              style={{ background:'rgba(18,18,22,0.7)', border:'1px solid rgba(255,255,255,0.06)', borderLeft:'3px solid rgba(99,102,241,0.4)' }}>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[11px] font-bold text-indigo-400">{step}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white mb-1">{title}</p>
                  <p className="text-[11px] text-zinc-500 mb-2">{desc}</p>
                  <textarea
                    placeholder={example}
                    rows={2}
                    defaultValue={localStorage.getItem(`emo_safety_${step}`) || ''}
                    onChange={e => localStorage.setItem(`emo_safety_${step}`, e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 outline-none resize-none"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-[11px] text-zinc-700 mt-2 text-center">Your answers are saved automatically in your browser.</p>
      </div>
    </div>
  );
}
