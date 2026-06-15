import { motion } from 'framer-motion';

/**
 * PremiumIcon — renders a Lucide icon inside a gradient glowing container
 * with a glass shine overlay and hover animation.
 */
export function PremiumIcon({
  icon: Icon,
  size = 22,
  boxSize = 56,
  gradient = 'linear-gradient(135deg, #34c796 0%, #2da87e 100%)',
  glow = 'rgba(52,199,150,0.35)',
  rotate = 0,
  animate = true,
}) {
  const radius = boxSize * 0.30;
  const Wrapper = animate ? motion.div : 'div';
  const props = animate
    ? { whileHover: { scale: 1.12, rotate: rotate + 5, boxShadow: `0 12px 36px ${glow}` }, transition: { type: 'spring', stiffness: 400, damping: 18 } }
    : {};

  return (
    <Wrapper
      {...props}
      style={{
        width: boxSize,
        height: boxSize,
        borderRadius: radius,
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 8px 24px ${glow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        cursor: 'default',
      }}
    >
      {/* Glass shine */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '55%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 100%)',
        borderRadius: `${radius}px ${radius}px 60% 60%`,
        pointerEvents: 'none',
      }} />
      {/* Subtle inner ring */}
      <div style={{
        position: 'absolute',
        inset: 2,
        borderRadius: radius - 2,
        border: '1px solid rgba(255,255,255,0.15)',
        pointerEvents: 'none',
      }} />
      <Icon size={size} color="white" strokeWidth={1.8} style={{ position: 'relative', zIndex: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
    </Wrapper>
  );
}

/**
 * MoodIcon — premium styled mood badge with emoji + gradient background
 */
export function MoodIcon({ emoji, color = '#34c796', size = 36, label }) {
  return (
    <motion.div
      whileHover={{ scale: 1.15, y: -2 }}
      whileTap={{ scale: 0.92 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}
    >
      <div style={{
        width: size, height: size,
        borderRadius: size * 0.3,
        background: `linear-gradient(135deg, ${color}22, ${color}44)`,
        border: `1.5px solid ${color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.52,
        boxShadow: `0 4px 16px ${color}33`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: 'inherit' }} />
        <span style={{ position: 'relative', zIndex: 1 }}>{emoji}</span>
      </div>
      {label && <span style={{ fontSize: 10, color: 'rgba(232,245,240,0.5)', fontWeight: 500 }}>{label}</span>}
    </motion.div>
  );
}

/**
 * AvatarIcon — gradient avatar for testimonials and user cards
 */
export function AvatarIcon({ initials, size = 44, gradient = 'linear-gradient(135deg, #34c796, #2da87e)' }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: gradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38,
      fontWeight: 700,
      color: '#050c0a',
      boxShadow: `0 4px 16px rgba(52,199,150,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
      flexShrink: 0,
      letterSpacing: '-0.5px',
    }}>
      {initials}
    </div>
  );
}

/**
 * StatIcon — small icon for stat cards with gradient ring
 */
export function StatIcon({ icon: Icon, color = '#34c796', size = 16, boxSize = 36 }) {
  return (
    <div style={{
      width: boxSize, height: boxSize,
      borderRadius: boxSize * 0.3,
      background: `${color}18`,
      border: `1px solid ${color}33`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 4px 12px ${color}22`,
    }}>
      <Icon size={size} color={color} strokeWidth={1.8} />
    </div>
  );
}

/**
 * NumberStep — premium step number badge
 */
export function NumberStep({ num }) {
  return (
    <motion.div
      whileHover={{ scale: 1.08, boxShadow: '0 0 32px rgba(52,199,150,0.3)' }}
      style={{
        width: 80, height: 80,
        borderRadius: '50%',
        background: 'rgba(15,28,22,0.9)',
        border: '1px solid rgba(52,199,150,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        fontSize: 26,
        color: '#34c796',
        position: 'relative',
        transition: 'all 0.3s',
        boxShadow: '0 0 0 1px rgba(52,199,150,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Inner glow ring */}
      <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', border: '1px solid rgba(52,199,150,0.1)', pointerEvents: 'none' }} />
      {num}
    </motion.div>
  );
}
