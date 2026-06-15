/* ============================================================
   🌙 EMOCARE — MIDNIGHT MODE (PERMANENT)
   Stars and Calm Breathing Widget
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. Apply midnight theme immediately ── */
  document.body.className = 'theme-midnight';

  /* ── 2. Inject styles for the animations ── */
  const style = document.createElement('style');
  style.textContent = `
    /* Star canvas sits behind everything */
    #starCanvas {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: -1;
      opacity: 1;
    }

    /* Breathing widget */
    #breathingWidget {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    #breathingWidget.collapsed .breath-content { display: none; }

    .breath-toggle {
      background: var(--dm-surface-2, #181c35);
      border: 1.5px solid var(--dm-border, rgba(139,120,255,0.4));
      border-radius: 100px;
      padding: 8px 16px;
      color: var(--dm-primary, #8b78ff);
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 12px var(--dm-primary-glow, rgba(139,120,255,0.25));
      transition: box-shadow 0.2s;
    }
    .breath-toggle:hover {
      box-shadow: 0 4px 24px rgba(0,0,0,0.5), 0 0 24px var(--dm-primary-glow, rgba(139,120,255,0.4));
    }
    .breath-content {
      background: var(--dm-surface-2, rgba(24, 28, 53, 0.92));
      border: 1px solid var(--dm-border, rgba(139,120,255,0.4));
      border-radius: 20px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 30px var(--dm-primary-glow, rgba(139,120,255,0.2));
      backdrop-filter: blur(14px);
      width: 200px;
    }
    .breath-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--dm-primary, rgba(139,120,255,0.6));
      margin-bottom: 16px;
      font-family: 'DM Sans', sans-serif;
    }
    .breath-circle-wrap {
      position: relative;
      width: 100px;
      height: 100px;
      margin: 0 auto 14px;
    }
    .breath-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid var(--dm-primary, #8b78ff);
      animation: b-ring 8s ease-in-out infinite;
    }
    .breath-ring:nth-child(2) { animation-delay: -2.5s; }
    .breath-ring:nth-child(3) { animation-delay: -5s; }
    @keyframes b-ring {
      0%,100% { transform: scale(0.55); opacity: 0.45; }
      50%      { transform: scale(1.45); opacity: 0; }
    }
    .breath-circle {
      position: absolute;
      inset: 14px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--dm-primary, #6c57f0) 0%, transparent 100%);
      box-shadow: 0 0 24px var(--dm-primary-glow, rgba(139,120,255,0.35));
      animation: b-core 8s ease-in-out infinite;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }
    @keyframes b-core {
      0%,100% { transform: scale(0.82); }
      50%      { transform: scale(1.18); }
    }
    .breath-phase {
      font-size: 13px;
      color: var(--dm-text-mid, #b0a8d8);
      font-family: 'DM Sans', sans-serif;
      min-height: 20px;
    }
    .breath-sub {
      font-size: 10px;
      color: var(--dm-text-soft, rgba(139,120,255,0.5));
      margin-top: 3px;
      font-family: 'DM Sans', sans-serif;
    }
  `;
  document.head.appendChild(style);

  /* ── 3. DOM helpers built after page load ── */
  function init() {
    if (document.getElementById('starCanvas')) return; // Already built
    buildUI();
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', init);
  } else {
    init(); // Document already loaded
  }

  function buildUI() {
    /* Star canvas */
    const canvas = document.createElement('canvas');
    canvas.id = 'starCanvas';
    document.body.appendChild(canvas);
    initStars(canvas);

    /* Breathing widget */
    const widget = document.createElement('div');
    widget.id = 'breathingWidget';
    widget.classList.add('collapsed');
    widget.innerHTML = \`
      <button class="breath-toggle" onclick="toggleBreathWidget()" title="Calm breathing guide">
        🌬️ Breathe
      </button>
      <div class="breath-content">
        <div class="breath-title">Calm Breathing</div>
        <div class="breath-circle-wrap">
          <div class="breath-ring"></div>
          <div class="breath-ring"></div>
          <div class="breath-ring"></div>
          <div class="breath-circle" id="breathEmoji">🌙</div>
        </div>
        <div class="breath-phase" id="breathPhase">Breathe in…</div>
        <div class="breath-sub" id="breathSub">4 · 4 · 4 box breathing</div>
      </div>\`;
    document.body.appendChild(widget);
    startBreathCycle();
    
    /* Remove any existing dark toggle buttons that might be hardcoded in HTML */
    document.querySelectorAll('.dark-toggle-btn').forEach(btn => btn.remove());
  }

  /* ── 10. Star field canvas ── */
  function initStars(canvas) {
    const ctx = canvas.getContext('2d');
    let stars = [];
    let W, H;

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      stars = Array.from({ length: 180 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.3 + Math.random() * 1.4,
        a: Math.random(),
        speed: 0.003 + Math.random() * 0.008,
      }));
    }
    window.addEventListener('resize', resize);
    resize();

    function draw() {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.a += s.speed;
        const alpha = (Math.sin(s.a) + 1) / 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = \`rgba(255,255,255,\${0.2 + alpha * 0.8})\`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ── 11. Breathing widget cycle ── */
  function startBreathCycle() {
    const phases = [
      { label: 'Breathe in…', sub: 'inhale slowly',  dur: 4000 },
      { label: 'Hold…',       sub: 'hold steady',    dur: 4000 },
      { label: 'Breathe out…',sub: 'exhale gently',  dur: 4000 },
      { label: 'Hold…',       sub: 'rest',            dur: 4000 },
    ];
    let i = 0;
    function tick() {
      const ph = document.getElementById('breathPhase');
      const sub = document.getElementById('breathSub');
      if (ph && sub) {
        ph.textContent  = phases[i].label;
        sub.textContent = phases[i].sub;
      }
      i = (i + 1) % phases.length;
      setTimeout(tick, phases[(i - 1 + phases.length) % phases.length].dur);
    }
    tick();
  }

  window.toggleBreathWidget = function () {
    document.getElementById('breathingWidget').classList.toggle('collapsed');
  };

})();
