/**
 * EmoCare Breathing Exercise Engine
 * Patterns: 4-7-8 Relaxation, Box Breathing, Deep Breath
 * Features: animated circle, phase text, countdown, cycles, quotes
 */

const Breathe = (() => {
  // ── Patterns ──────────────────────────────────────────────
  const PATTERNS = {
    relax478: {
      name: '4-7-8 Relaxation',
      description: 'Calms the nervous system',
      icon: '🌙',
      phases: [
        { name: 'Breathe In', duration: 4, action: 'inhale' },
        { name: 'Hold', duration: 7, action: 'hold' },
        { name: 'Breathe Out', duration: 8, action: 'exhale' }
      ]
    },
    box: {
      name: 'Box Breathing',
      description: 'Used by Navy SEALs for focus',
      icon: '📦',
      phases: [
        { name: 'Breathe In', duration: 4, action: 'inhale' },
        { name: 'Hold', duration: 4, action: 'hold' },
        { name: 'Breathe Out', duration: 4, action: 'exhale' },
        { name: 'Hold', duration: 4, action: 'hold' }
      ]
    },
    deep: {
      name: 'Deep Breath',
      description: 'Simple and effective',
      icon: '🌊',
      phases: [
        { name: 'Breathe In', duration: 5, action: 'inhale' },
        { name: 'Breathe Out', duration: 5, action: 'exhale' }
      ]
    }
  };

  const QUOTES = [
    '"Breathing in, I calm my body. Breathing out, I smile." — Thich Nhat Hanh',
    '"Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor." — Thich Nhat Hanh',
    '"The greatest weapon against stress is our ability to choose one thought over another." — William James',
    '"Almost everything will work again if you unplug it for a few minutes, including you." — Anne Lamott',
    '"Within you, there is a stillness and a sanctuary to which you can retreat at any time." — Hermann Hesse'
  ];

  // ── State ─────────────────────────────────────────────────
  let currentPatternKey = 'relax478';
  let isRunning = false;
  let isPaused = false;
  let currentPhaseIndex = 0;
  let timer = null;
  let countdownTimer = null;
  let cycleCount = 0;
  let totalSeconds = 0;
  let secondsTimer = null;
  let currentCountdown = 0;

  // ── DOM Elements ──────────────────────────────────────────
  function el(id) { return document.getElementById(id); }

  // ── Pattern Selection ─────────────────────────────────────
  function selectPattern(key) {
    if (isRunning) stop();
    currentPatternKey = key;
    const pattern = PATTERNS[key];

    // Update UI
    const cards = document.querySelectorAll('.pattern-card');
    cards.forEach(card => {
      card.classList.toggle('selected', card.dataset.pattern === key);
    });

    const titleEl = el('patternName');
    if (titleEl) titleEl.textContent = pattern.name;

    reset();
  }

  // ── Start / Pause / Stop ──────────────────────────────────
  function start() {
    if (isRunning && !isPaused) return;

    if (isPaused) {
      isPaused = false;
      updateControlButton();
      runPhase(currentPhaseIndex);
      startSecondsCounter();
      return;
    }

    isRunning = true;
    isPaused = false;
    cycleCount = 0;
    totalSeconds = 0;
    currentPhaseIndex = 0;

    updateStats();
    updateControlButton();
    startSecondsCounter();
    runPhase(0);
  }

  function pause() {
    if (!isRunning || isPaused) return;
    isPaused = true;
    clearTimeout(timer);
    clearInterval(countdownTimer);
    clearInterval(secondsTimer);
    updateControlButton();
  }

  function toggleStartPause() {
    if (!isRunning || isPaused) {
      start();
    } else {
      pause();
    }
  }

  function stop() {
    isRunning = false;
    isPaused = false;
    clearTimeout(timer);
    clearInterval(countdownTimer);
    clearInterval(secondsTimer);
    reset();
  }

  function reset() {
    currentPhaseIndex = 0;
    cycleCount = 0;
    totalSeconds = 0;
    currentCountdown = 0;

    updateCircle('idle', 0);
    updatePhaseText('Ready');
    updateCountdownText('');
    updateStats();
    updateControlButton();
  }

  // ── Run Phase ─────────────────────────────────────────────
  function runPhase(phaseIndex) {
    if (!isRunning || isPaused) return;

    const pattern = PATTERNS[currentPatternKey];
    const phase = pattern.phases[phaseIndex];
    currentPhaseIndex = phaseIndex;

    // Update phase text
    updatePhaseText(phase.name);
    updateCircle(phase.action, 0);

    // Countdown
    currentCountdown = phase.duration;
    updateCountdownText(currentCountdown);

    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      currentCountdown--;
      if (currentCountdown > 0) {
        updateCountdownText(currentCountdown);
        const progress = 1 - (currentCountdown / phase.duration);
        updateCircle(phase.action, progress);
      } else {
        updateCountdownText('');
        clearInterval(countdownTimer);
      }
    }, 1000);

    // Schedule next phase
    clearTimeout(timer);
    timer = setTimeout(() => {
      const nextPhase = phaseIndex + 1;
      if (nextPhase >= pattern.phases.length) {
        // Cycle complete
        cycleCount++;
        updateStats();
        updateQuote();
        runPhase(0);
      } else {
        runPhase(nextPhase);
      }
    }, phase.duration * 1000);
  }

  // ── Circle Animation ─────────────────────────────────────
  function updateCircle(action, progress) {
    const circle = el('breathingCircle');
    if (!circle) return;

    circle.classList.remove('inhale', 'exhale', 'hold');

    switch (action) {
      case 'inhale':
        circle.classList.add('inhale');
        break;
      case 'exhale':
        circle.classList.add('exhale');
        break;
      case 'hold':
        circle.classList.add('hold');
        break;
      default:
        // idle — reset to neutral
        circle.style.transform = 'scale(1)';
    }
  }

  // ── UI Updates ────────────────────────────────────────────
  function updatePhaseText(text) {
    const textEl = el('breathText');
    if (textEl) textEl.textContent = text;
  }

  function updateCountdownText(value) {
    const timerEl = el('breathTimer');
    if (timerEl) timerEl.textContent = value || '';
  }

  function updateStats() {
    const cyclesEl = el('breathCycles');
    const timeEl = el('breathTime');
    if (cyclesEl) cyclesEl.textContent = cycleCount;
    if (timeEl) timeEl.textContent = formatTime(totalSeconds);
  }

  function updateControlButton() {
    const btn = el('breatheControlBtn');
    if (!btn) return;

    if (!isRunning || isPaused) {
      btn.textContent = isRunning ? '▶ Resume' : '▶ Start';
      btn.classList.remove('active');
    } else {
      btn.textContent = '⏸ Pause';
      btn.classList.add('active');
    }
  }

  function updateQuote() {
    const quoteEl = el('breatheQuote');
    if (quoteEl) {
      const idx = cycleCount % QUOTES.length;
      quoteEl.textContent = QUOTES[idx];
    }
  }

  function startSecondsCounter() {
    clearInterval(secondsTimer);
    secondsTimer = setInterval(() => {
      totalSeconds++;
      updateStats();
    }, 1000);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // ── Initialization ────────────────────────────────────────
  function init() {
    // Pattern card click handlers
    document.querySelectorAll('.pattern-card').forEach(card => {
      card.addEventListener('click', () => {
        selectPattern(card.dataset.pattern);
      });
    });

    // Control button
    const controlBtn = el('breatheControlBtn');
    if (controlBtn) {
      controlBtn.addEventListener('click', toggleStartPause);
    }

    // Stop button
    const stopBtn = el('breatheStopBtn');
    if (stopBtn) {
      stopBtn.addEventListener('click', stop);
    }

    // Set default pattern
    selectPattern('relax478');

    // Set initial quote
    const quoteEl = el('breatheQuote');
    if (quoteEl) quoteEl.textContent = QUOTES[0];
  }

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    selectPattern,
    start,
    pause,
    stop,
    toggleStartPause,
    PATTERNS
  };
})();
