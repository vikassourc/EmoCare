import { useEffect, useRef } from 'react';

// Green-themed ambient orbs matching the EmoCare dark-green palette
const ORBS = [
  { x: 0.15, y: 0.20, r: 0.40, color: [52,  199, 150], speed: 0.00018, phase: 0   },
  { x: 0.75, y: 0.20, r: 0.30, color: [45,  168, 126], speed: 0.00014, phase: 2.1 },
  { x: 0.50, y: 0.75, r: 0.38, color: [78,  184, 160], speed: 0.00016, phase: 4.2 },
  { x: 0.85, y: 0.65, r: 0.25, color: [26,  74,  58 ], speed: 0.00020, phase: 1.0 },
];

export default function CalmingQuantumBackground() {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let width, height;

    const resize = () => {
      width  = canvas.width  = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const PERIOD = 10000;

    const draw = (ts) => {
      ctx.clearRect(0, 0, width, height);

      // Deep dark green background
      ctx.fillStyle = '#050c0a';
      ctx.fillRect(0, 0, width, height);

      ORBS.forEach((orb) => {
        const breathe = Math.sin((ts * Math.PI * 2) / PERIOD + orb.phase);
        const scale   = 1 + breathe * 0.18;

        const dx = Math.cos(ts * orb.speed + orb.phase) * 0.06;
        const dy = Math.sin(ts * orb.speed * 0.7 + orb.phase) * 0.04;

        const cx     = (orb.x + dx) * width;
        const cy     = (orb.y + dy) * height;
        const radius = orb.r * Math.min(width, height) * scale;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const [r, g, b] = orb.color;

        grad.addColorStop(0,   `rgba(${r},${g},${b},0.14)`);
        grad.addColorStop(0.4, `rgba(${r},${g},${b},0.06)`);
        grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 quantum-bg-container"
      style={{ filter: 'blur(50px)' }}
    />
  );
}
