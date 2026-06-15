import React from 'react';

export default function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      <div className="orb orb-emerald" />
      <div className="orb orb-violet" />
      <div className="orb orb-breath" />
      <div className="grain" />

      <style>{`
        .ambient-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background: radial-gradient(120% 100% at 50% 0%, #0a1411 0%, #050807 55%, #050706 100%);
          pointer-events: none;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          will-change: transform, opacity;
        }

        /* Emerald glow, drifting top-left */
        .orb-emerald {
          width: 560px;
          height: 560px;
          top: -160px;
          left: -140px;
          background: radial-gradient(circle, rgba(52, 232, 164, 0.16), transparent 70%);
          animation: driftA 38s ease-in-out infinite alternate;
        }

        /* Soft violet glow, drifting bottom-right (echoes the "Breathe" accent) */
        .orb-violet {
          width: 640px;
          height: 640px;
          bottom: -200px;
          right: -160px;
          background: radial-gradient(circle, rgba(129, 140, 248, 0.13), transparent 70%);
          animation: driftB 46s ease-in-out infinite alternate;
        }

        /* Central glow that slowly expands and contracts like a breath cycle */
        .orb-breath {
          width: 720px;
          height: 720px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(52, 232, 164, 0.05), transparent 70%);
          animation: breathe 9s ease-in-out infinite;
        }

        /* Subtle film grain so the gradients don't look flat/banded */
        .grain {
          position: absolute;
          inset: -50%;
          width: 200%;
          height: 200%;
          opacity: 0.035;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        @keyframes driftA {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(70px, 50px) scale(1.1); }
        }

        @keyframes driftB {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-60px, -40px) scale(1.08); }
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.45; transform: translate(-50%, -50%) scale(0.92); }
          50%      { opacity: 1;    transform: translate(-50%, -50%) scale(1.05); }
        }

        @media (prefers-reduced-motion: reduce) {
          .orb { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
