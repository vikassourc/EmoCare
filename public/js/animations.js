/**
 * EmoCare — Advanced Animation Controller
 * Scroll reveals, parallax, counters, 3D tilt, ripple effects, cursor glow
 * @module animations
 */

(function () {
  'use strict';

  // ── Scroll Reveal (Intersection Observer) ─────────────────
  function initScrollReveal() {
    const revealEls = document.querySelectorAll('[data-reveal]');
    const staggerEls = document.querySelectorAll('[data-reveal-stagger]');

    if (!revealEls.length && !staggerEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach((el) => observer.observe(el));
    staggerEls.forEach((el) => observer.observe(el));
  }

  // ── Number Counter Animation ──────────────────────────────
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  function animateCounter(el) {
    const target = el.getAttribute('data-count');
    const suffix = el.getAttribute('data-count-suffix') || '';
    const prefix = el.getAttribute('data-count-prefix') || '';
    const duration = parseInt(el.getAttribute('data-count-duration') || '1200', 10);

    // Parse the target — handle numbers like "10K+", "98%", "24/7"
    let numericTarget;
    let displaySuffix = suffix;

    if (target.includes('/')) {
      // Special case like "24/7"
      el.textContent = target;
      el.style.opacity = '1';
      return;
    }

    if (target.includes('K')) {
      numericTarget = parseFloat(target.replace('K', '').replace('+', ''));
      displaySuffix = 'K+';
    } else if (target.includes('%')) {
      numericTarget = parseFloat(target.replace('%', ''));
      displaySuffix = '%';
    } else {
      numericTarget = parseFloat(target.replace('+', ''));
      if (target.includes('+')) displaySuffix = '+';
    }

    if (isNaN(numericTarget)) {
      el.textContent = target;
      return;
    }

    const startTime = performance.now();
    const isDecimal = numericTarget % 1 !== 0;

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = numericTarget * eased;

      el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.round(current)) + displaySuffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ── 3D Card Tilt Effect ───────────────────────────────────
  function initTiltCards() {
    const cards = document.querySelectorAll('.tilt-card');
    if (!cards.length) return;

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      });
    });
  }

  // ── Mouse Parallax on Hero ────────────────────────────────
  function initHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const orbs = hero.querySelectorAll('.hero-bg-orb');
    const phone = hero.querySelector('.phone-mock');

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      orbs.forEach((orb, i) => {
        const speed = (i + 1) * 25;
        orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
      });

      if (phone) {
        const rotateX = y * -10;
        const rotateY = x * 10;
        phone.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${Math.sin(Date.now() / 1000) * 6}px)`;
      }
    });

    hero.addEventListener('mouseleave', () => {
      orbs.forEach((orb) => {
        orb.style.transform = '';
        orb.style.transition = 'transform 0.6s ease';
        setTimeout(() => { orb.style.transition = ''; }, 600);
      });
      if (phone) {
        phone.style.transform = '';
        phone.style.transition = 'transform 0.6s ease';
        setTimeout(() => { phone.style.transition = ''; }, 600);
      }
    });
  }

  // ── Ripple Effect on Buttons ──────────────────────────────
  function initRippleEffect() {
    const buttons = document.querySelectorAll(
      '.btn-primary, .btn-ghost, .auth-submit, .send-btn, .breathe-start-btn, .topbar-btn, .prompt-btn, .mood-chip'
    );

    buttons.forEach((btn) => {
      btn.classList.add('ripple-container');
      btn.addEventListener('click', (e) => {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  }

  // ── Cursor Glow Trail ─────────────────────────────────────
  function initCursorGlow() {
    // Only on desktop, skip on touch devices
    if ('ontouchstart' in window || window.innerWidth < 768) return;

    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function updateGlow() {
      glowX += (mouseX - glowX) * 0.08;
      glowY += (mouseY - glowY) * 0.08;
      glow.style.left = glowX + 'px';
      glow.style.top = glowY + 'px';
      requestAnimationFrame(updateGlow);
    }

    requestAnimationFrame(updateGlow);
  }

  // ── Nav Scroll Effect ─────────────────────────────────────
  function initNavScroll() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY > 40) {
            nav.classList.add('scrolled');
          } else {
            nav.classList.remove('scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ── Magnetic Button Effect ────────────────────────────────
  function initMagneticButtons() {
    if ('ontouchstart' in window) return;

    const btns = document.querySelectorAll('.btn-primary.btn-lg, .auth-submit, .breathe-start-btn');

    btns.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) translateY(-3px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => { btn.style.transition = ''; }, 400);
      });
    });
  }

  // ── Smooth Page Enter ─────────────────────────────────────
  function initPageEnter() {
    document.body.classList.add('page-enter');
  }

  // ── Aurora Background Particles ───────────────────────────
  function initAuroraParticles() {
    const auroraBg = document.querySelector('.aurora-bg');
    if (!auroraBg) return;

    for (let i = 0; i < 3; i++) {
      const particle = document.createElement('div');
      particle.className = 'aurora-particle';
      auroraBg.appendChild(particle);
    }
  }

  // ── Typed Text Effect (Hero title) ────────────────────────
  function initTextReveal() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;

    // Add shimmer to the em element
    const emEl = heroTitle.querySelector('em');
    if (emEl) {
      emEl.classList.add('shimmer-text');
    }
  }

  // ── Dashboard Bar Animation Delay ─────────────────────────
  function initDashboardAnimations() {
    const moodBars = document.querySelectorAll('.mood-bar-fill');
    moodBars.forEach((bar, i) => {
      bar.style.animationDelay = `${i * 0.1}s`;
    });

    const triggerBars = document.querySelectorAll('.trigger-bar-fill');
    triggerBars.forEach((bar, i) => {
      bar.style.animationDelay = `${i * 0.15}s`;
    });
  }

  // ── Intersection Observer for Chat Messages ───────────────
  function initChatAnimations() {
    const messagesArea = document.querySelector('.messages-area');
    if (!messagesArea) return;

    // Re-animate messages as they're added
    const mutObs = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.classList && node.classList.contains('msg-row')) {
            node.style.animation = 'none';
            requestAnimationFrame(() => {
              node.style.animation = '';
            });
          }
        });
      });
    });

    mutObs.observe(messagesArea, { childList: true });
  }

  // ── Smooth Section Scrolling ──────────────────────────────
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ── Initialize Everything ─────────────────────────────────
  function init() {
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Still add revealed class so content is visible
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('revealed'));
      document.querySelectorAll('[data-reveal-stagger]').forEach((el) => el.classList.add('revealed'));
      return;
    }

    initPageEnter();
    initScrollReveal();
    initCounters();
    initTiltCards();
    initHeroParallax();
    initRippleEffect();
    initCursorGlow();
    initNavScroll();
    initMagneticButtons();
    initAuroraParticles();
    initTextReveal();
    initDashboardAnimations();
    initChatAnimations();
    initSmoothScroll();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
