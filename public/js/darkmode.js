/* ============================================================
   🌙 EMOCARE — MIDNIGHT FOCUS DARK MODE
   Rocket launch animation when toggling dark mode
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. Apply saved theme immediately (no flash) ── */
  const saved = localStorage.getItem('emocare_dark');
  if (saved === '1') document.documentElement.classList.add('dark-pending');

  /* ── 2. Inject styles for the rocket overlay ── */
  const style = document.createElement('style');
  style.textContent = `
    /* Rocket Overlay */
    #rocketOverlay {
      position: fixed;
      inset: 0;
      z-index: 99998;
      pointer-events: none;
      overflow: hidden;
    }
    #rocketOverlay.active { pointer-events: all; }

    /* Full-screen "warp" flash */
    #warpFlash {
      position: fixed;
      inset: 0;
      z-index: 99997;
      background: radial-gradient(ellipse at 50% 60%, #8b78ff 0%, #0b0d1a 60%);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
    }
    #warpFlash.on { opacity: 1; }

    /* Rocket element */
    #rocket {
      position: absolute;
      left: 50%;
      bottom: -120px;
      transform: translateX(-50%);
      font-size: 52px;
      line-height: 1;
      filter: drop-shadow(0 0 16px rgba(139,120,255,0.9));
      transition: none;
      will-change: transform, opacity;
      z-index: 99999;
    }

    /* Exhaust trail particles */
    .exhaust-particle {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      animation: exhaustFade 0.7s ease-out forwards;
    }
    @keyframes exhaustFade {
      0%   { opacity: 0.9; transform: scale(1) translateY(0); }
      100% { opacity: 0; transform: scale(0.2) translateY(30px); }
    }

    /* Stars that shoot in when dark mode activates */
    .shoot-star {
      position: fixed;
      top: 0;
      width: 2px;
      height: 80px;
      border-radius: 2px;
      background: linear-gradient(to bottom, transparent, #fff);
      pointer-events: none;
      z-index: 99996;
      animation: shootDown linear forwards;
    }
    @keyframes shootDown {
      from { transform: translateY(-100px); opacity: 1; }
      to   { transform: translateY(110vh);  opacity: 0.3; }
    }

    /* Launch ring shockwave */
    .launch-ring {
      position: absolute;
      left: 50%;
      border-radius: 50%;
      border: 2px solid rgba(139,120,255,0.6);
      pointer-events: none;
      animation: ringExpand 0.8s ease-out forwards;
      transform: translate(-50%, 50%);
    }
    @keyframes ringExpand {
      from { width: 20px; height: 20px; margin-left: -10px; opacity: 1; }
      to   { width: 300px; height: 300px; margin-left: -150px; opacity: 0; }
    }

    /* Countdown badge */
    #darkCountdown {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      font-family: 'Fraunces', serif;
      font-size: 88px;
      color: #fff;
      text-shadow: 0 0 40px rgba(139,120,255,0.8);
      z-index: 99999;
      pointer-events: none;
      transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1), opacity 0.15s ease;
      opacity: 0;
    }
    #darkCountdown.show { transform: translate(-50%,-50%) scale(1); opacity: 1; }
    #darkCountdown.hide { transform: translate(-50%,-50%) scale(1.5); opacity: 0; }

    /* Star canvas sits behind everything */
    #starCanvas {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      opacity: 0;
      transition: opacity 0.8s ease;
    }
    body.dark #starCanvas { opacity: 1; }

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
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px);
      transition: opacity 0.5s ease, transform 0.5s ease;
    }
    body.dark #breathingWidget {
      opacity: 1;
      pointer-events: all;
      transform: translateY(0);
    }
    #breathingWidget.collapsed .breath-content { display: none; }

    .breath-toggle {
      background: var(--dm-surface-2, #181c35);
      border: 1.5px solid rgba(139,120,255,0.4);
      border-radius: 100px;
      padding: 8px 16px;
      color: #8b78ff;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 12px rgba(139,120,255,0.25);
      transition: box-shadow 0.2s;
    }
    .breath-toggle:hover {
      box-shadow: 0 4px 24px rgba(0,0,0,0.5), 0 0 24px rgba(139,120,255,0.4);
    }
    .breath-content {
      background: rgba(24, 28, 53, 0.92);
      border: 1px solid rgba(139,120,255,0.4);
      border-radius: 20px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(139,120,255,0.2);
      backdrop-filter: blur(14px);
      width: 200px;
    }
    .breath-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(139,120,255,0.6);
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
      border: 2px solid #8b78ff;
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
      background: radial-gradient(circle, #6c57f0 0%, rgba(108,87,240,0.35) 60%, transparent 100%);
      box-shadow: 0 0 24px rgba(139,120,255,0.35);
      animation: b-core 8s ease-in-out infinite;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
    }
    @keyframes b-core {
      0%,100% { transform: scale(0.82); }
      50%      { transform: scale(1.18); box-shadow: 0 0 36px rgba(139,120,255,0.55); }
    }
    .breath-phase {
      font-size: 13px;
      color: #b0a8d8;
      font-family: 'DM Sans', sans-serif;
      min-height: 20px;
    }
    .breath-sub {
      font-size: 10px;
      color: rgba(139,120,255,0.5);
      margin-top: 3px;
      font-family: 'DM Sans', sans-serif;
    }
  `;
  document.head.appendChild(style);

  /* ── 3. DOM helpers built after page load ── */
  window.addEventListener('DOMContentLoaded', () => {
    buildUI();
    applyTheme(localStorage.getItem('emocare_dark') === '1', false);
  });

  /* ── 4. Build overlay + toggle + widgets ── */
  function buildUI() {
    /* Star canvas */
    const canvas = document.createElement('canvas');
    canvas.id = 'starCanvas';
    document.body.appendChild(canvas);
    initStars(canvas);

    /* Warp flash */
    const flash = document.createElement('div');
    flash.id = 'warpFlash';
    document.body.appendChild(flash);

    /* Rocket overlay */
    const overlay = document.createElement('div');
    overlay.id = 'rocketOverlay';
    document.body.appendChild(overlay);

    /* Countdown badge */
    const countdown = document.createElement('div');
    countdown.id = 'darkCountdown';
    document.body.appendChild(countdown);

    /* Breathing widget */
    const widget = document.createElement('div');
    widget.id = 'breathingWidget';
    widget.classList.add('collapsed');
    widget.innerHTML = `
      <button class="breath-toggle" onclick="toggleBreathWidget()" title="Calm breathing guide">
        🌬️ Breathe
      </button>
      <div class="breath-content">
        <div class="breath-title">Calm Breathing</div>
        <div class="breath-circle-wrap">
          <div class="breath-ring"></div>
          <div class="breath-ring"></div>
          <div class="breath-ring"></div>
          <div class="breath-circle">🌙</div>
        </div>
        <div class="breath-phase" id="breathPhase">Breathe in…</div>
        <div class="breath-sub" id="breathSub">4 · 4 · 4 box breathing</div>
      </div>`;
    document.body.appendChild(widget);
    startBreathCycle();

    /* Inject toggle button into every nav */
    document.querySelectorAll('.nav, .dashboard-nav').forEach(nav => {
      const btn = document.createElement('button');
      btn.className = 'dark-toggle-btn';
      btn.id = 'darkToggleBtn';
      btn.setAttribute('aria-label', 'Toggle Midnight Focus dark mode');
      btn.innerHTML = `<span class="toggle-icon">🌙</span><span class="toggle-label">Night Mode</span>`;
      btn.onclick = handleDarkToggle;
      nav.appendChild(btn);
    });

    updateToggleLabel();
  }

  /* ── 5. Apply / remove theme ── */
  function applyTheme(dark, animate) {
    if (dark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    updateToggleLabel();
    localStorage.setItem('emocare_dark', dark ? '1' : '0');
  }

  function updateToggleLabel() {
    const isDark = document.body.classList.contains('dark');
    document.querySelectorAll('#darkToggleBtn').forEach(btn => {
      btn.querySelector('.toggle-icon').textContent = isDark ? '☀️' : '🌙';
      btn.querySelector('.toggle-label').textContent = isDark ? 'Light Mode' : 'Night Mode';
    });
  }

  /* ── 6. Handle toggle click — triggers rocket launch ── */
  function handleDarkToggle() {
    const goingDark = !document.body.classList.contains('dark');
    if (goingDark) {
      launchRocket(() => applyTheme(true, true));
    } else {
      splashLand(() => applyTheme(false, true));
    }
  }
  window.handleDarkToggle = handleDarkToggle;

  /* ── 7. 🚀 ROCKET LAUNCH ANIMATION ── */
  function launchRocket(onComplete) {
    const overlay = document.getElementById('rocketOverlay');
    const flash   = document.getElementById('warpFlash');
    const countdown = document.getElementById('darkCountdown');

    overlay.classList.add('active');

    /* Create rocket */
    const rocket = document.createElement('div');
    rocket.id = 'rocket';
    rocket.textContent = '🚀';
    overlay.appendChild(rocket);

    /* Exhaust trail interval */
    let exhaustInterval = setInterval(() => spawnExhaust(overlay, rocket), 60);

    /* Phase timings:
       0ms   – rocket appears at bottom
       300ms – countdown "3"
       900ms – countdown "2"
       1500ms – countdown "1"
       2100ms – countdown "🚀" + rocket launches
       2600ms – warp flash
       2750ms – switch theme
       3200ms – stars rain in
       3800ms – done, cleanup
    */

    const phases = [
      { t: 0,    fn: () => { rocket.style.bottom = '-80px'; rocket.style.transition = 'none'; } },
      { t: 150,  fn: () => showCountdown(countdown, '3') },
      { t: 750,  fn: () => showCountdown(countdown, '2') },
      { t: 1350, fn: () => showCountdown(countdown, '1') },
      { t: 1950, fn: () => {
          showCountdown(countdown, '🚀');
          clearInterval(exhaustInterval);
          /* Shockwave rings */
          for (let i = 0; i < 3; i++) {
            setTimeout(() => spawnRing(overlay, rocket), i * 180);
          }
          /* LAUNCH — rocket flies up */
          rocket.style.transition = 'bottom 1.1s cubic-bezier(0.3,0,0.7,1), opacity 0.3s ease 0.8s';
          rocket.style.bottom = '110vh';
          rocket.style.opacity = '0';
          /* resume exhaust during launch */
          exhaustInterval = setInterval(() => spawnExhaust(overlay, rocket), 40);
        }
      },
      { t: 2500, fn: () => {
          clearInterval(exhaustInterval);
          flash.classList.add('on');
          hideCountdown(countdown);
        }
      },
      { t: 2750, fn: () => { onComplete(); flash.classList.remove('on'); } },
      { t: 3100, fn: () => rainStars(12) },
      { t: 3900, fn: () => {
          overlay.classList.remove('active');
          overlay.innerHTML = '';
        }
      },
    ];

    phases.forEach(({ t, fn }) => setTimeout(fn, t));
  }

  /* ── 8. 🌅 LAND animation (dark → light) ── */
  function splashLand(onComplete) {
    const overlay = document.getElementById('rocketOverlay');
    const flash   = document.getElementById('warpFlash');
    overlay.classList.add('active');

    /* Rocket descends from top */
    const rocket = document.createElement('div');
    rocket.id = 'rocket';
    rocket.textContent = '🚀';
    rocket.style.bottom = '110vh';
    rocket.style.fontSize = '52px';
    rocket.style.transform = 'translateX(-50%) rotate(180deg)'; /* nose down */
    rocket.style.filter = 'drop-shadow(0 0 16px rgba(255,200,80,0.9))';
    rocket.style.transition = 'none';
    overlay.appendChild(rocket);

    let exhaustInterval = setInterval(() => spawnExhaust(overlay, rocket, true), 60);

    setTimeout(() => {
      rocket.style.transition = 'bottom 1.2s cubic-bezier(0.3,0,0.8,1)';
      rocket.style.bottom = '5vh';
    }, 100);

    setTimeout(() => {
      clearInterval(exhaustInterval);
      flash.style.background = 'radial-gradient(ellipse at 50% 60%, #ffd97d 0%, #fff8e7 60%)';
      flash.classList.add('on');
    }, 1300);

    setTimeout(() => {
      onComplete();
      flash.classList.remove('on');
      flash.style.background = ''; // reset for next time
    }, 1600);

    setTimeout(() => {
      overlay.classList.remove('active');
      overlay.innerHTML = '';
    }, 2200);
  }

  /* ── 9. Helpers ── */
  function showCountdown(el, txt) {
    el.textContent = txt;
    el.classList.remove('hide');
    el.classList.add('show');
    setTimeout(() => { el.classList.remove('show'); el.classList.add('hide'); }, 500);
  }
  function hideCountdown(el) {
    el.classList.remove('show');
    el.classList.add('hide');
  }

  function spawnExhaust(overlay, rocket, flip = false) {
    const rect = rocket.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = flip ? rect.top : rect.bottom;

    const colors = ['#8b78ff', '#64d9c0', '#ff9f7f', '#ffd97d', '#fff'];
    for (let i = 0; i < 3; i++) {
      const p = document.createElement('div');
      p.className = 'exhaust-particle';
      const size = 6 + Math.random() * 14;
      p.style.cssText = `
        left: ${cx + (Math.random() - 0.5) * 30}px;
        top:  ${cy + (flip ? -20 : 5) + (Math.random() * 20)}px;
        width: ${size}px; height: ${size}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        opacity: ${0.6 + Math.random() * 0.4};
        animation-duration: ${0.5 + Math.random() * 0.4}s;
      `;
      overlay.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }

  function spawnRing(overlay, rocket) {
    const rect = rocket.getBoundingClientRect();
    const ring = document.createElement('div');
    ring.className = 'launch-ring';
    ring.style.bottom = (window.innerHeight - rect.bottom) + 'px';
    overlay.appendChild(ring);
    setTimeout(() => ring.remove(), 900);
  }

  function rainStars(count) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const s = document.createElement('div');
        s.className = 'shoot-star';
        const dur = 0.5 + Math.random() * 0.8;
        s.style.cssText = `
          left: ${Math.random() * 100}vw;
          opacity: ${0.5 + Math.random() * 0.5};
          animation-duration: ${dur}s;
          animation-delay: ${Math.random() * 0.5}s;
        `;
        document.body.appendChild(s);
        setTimeout(() => s.remove(), (dur + 0.6) * 1000);
      }, i * 80);
    }
  }

  /* ── 10. Star field canvas ── */
  function initStars(canvas) {
    const ctx = canvas.getContext('2d');
    let stars = [];
    let W, H, animId;

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
        ctx.fillStyle = `rgba(255,255,255,${0.2 + alpha * 0.8})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
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
