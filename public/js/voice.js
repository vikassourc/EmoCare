/**
 * EmoCare Voice Module
 * - toggleMode(): turn voice mode on/off (auto-reads AI replies)
 * - listen(): start speech-to-text, auto-sends on silence
 * - stop(): stop listening
 * - speak(text): read text aloud in female voice
 */

const Voice = (() => {
  let modeActive   = false;
  let isListening  = false;
  let recognition  = null;

  // ── Helpers ──────────────────────────────────────────────
  const $ = id => document.getElementById(id);

  // ── Female Voice Selection ────────────────────────────────
  function getFemaleVoice() {
    const voices = window.speechSynthesis.getVoices();

    // Priority list — best quality female voices first
    const priority = [
      'Google UK English Female',
      'Microsoft Aria Online (Natural)',
      'Microsoft Jenny Online (Natural)',
      'Microsoft Zira Desktop - English (United States)',
      'Samantha',
      'Karen',
      'Moira',
      'Fiona',
      'Tessa',
      'Victoria',
      'Allison',
      'Ava',
      'Susan',
    ];

    for (const name of priority) {
      const v = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
      if (v) return v;
    }

    // Fallback: any voice with female keywords
    const femaleKw = ['female', 'woman', 'girl', 'zira', 'aria', 'jenny',
                      'samantha', 'karen', 'moira', 'fiona', 'cortana'];
    for (const kw of femaleKw) {
      const v = voices.find(v => v.name.toLowerCase().includes(kw));
      if (v) return v;
    }

    // Last resort: first English voice
    return voices.find(v => v.lang && v.lang.startsWith('en')) || voices[0] || null;
  }

  // ── Text-to-Speech ────────────────────────────────────────
  function speak(text) {
    if (!window.speechSynthesis || !text) return;

    // Cancel ongoing speech
    window.speechSynthesis.cancel();

    // Strip markdown / insight blocks
    const clean = text
      .replace(/INSIGHT_START[\s\S]*?INSIGHT_END/g, '')
      .replace(/[#*_~`>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) return;

    const utter   = new SpeechSynthesisUtterance(clean);
    const voice   = getFemaleVoice();
    if (voice) utter.voice = voice;
    utter.lang    = voice ? voice.lang : 'en-US';
    utter.rate    = 0.92;   // slightly slower — warm, caring tone
    utter.pitch   = 1.08;  // slightly higher for female quality
    utter.volume  = 1.0;

    window.speechSynthesis.speak(utter);
  }

  function stopSpeaking() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  // ── Voice Mode Toggle ─────────────────────────────────────
  function toggleMode() {
    modeActive = !modeActive;
    const btn    = $('voiceModeBtn');
    const bar    = $('voiceStatusBar');

    if (modeActive) {
      if (btn) { btn.textContent = '🔊 Voice On'; btn.classList.add('active'); }
      if (bar)   bar.classList.add('visible');
    } else {
      if (btn) { btn.textContent = '🔇 Voice';    btn.classList.remove('active'); }
      if (bar)   bar.classList.remove('visible');
      stopSpeaking();
    }
  }

  // ── Speech Recognition (STT) ──────────────────────────────
  function buildRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition is not supported in this browser.\nPlease use Chrome or Microsoft Edge.');
      return null;
    }

    const rec           = new SR();
    rec.continuous      = false;
    rec.interimResults  = true;
    rec.lang            = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      isListening = true;
      const micBtn = $('micBtn');
      if (micBtn) micBtn.classList.add('listening');
      const overlay = $('voiceOverlay');
      if (overlay) overlay.classList.add('active');
      stopSpeaking(); // don't let AI speak while user talks
    };

    rec.onresult = event => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const input = $('chatInput');
      if (input) {
        input.value = transcript;
        // Trigger auto-resize if available
        input.dispatchEvent(new Event('input'));
      }
    };

    rec.onend = () => {
      isListening = false;
      const micBtn  = $('micBtn');
      const overlay = $('voiceOverlay');
      if (micBtn)  micBtn.classList.remove('listening');
      if (overlay) overlay.classList.remove('active');

      // Auto-send if content present
      const input = $('chatInput');
      if (input && input.value.trim()) {
        setTimeout(() => {
          // Use Chat module's sendMessage
          if (window.Chat && typeof window.Chat.sendMessage === 'function') {
            window.Chat.sendMessage();
          } else {
            // Fallback: click send button
            const sendBtn = $('sendBtn');
            if (sendBtn) sendBtn.click();
          }
        }, 350);
      }
    };

    rec.onerror = event => {
      isListening = false;
      const micBtn  = $('micBtn');
      const overlay = $('voiceOverlay');
      if (micBtn)  micBtn.classList.remove('listening');
      if (overlay) overlay.classList.remove('active');
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.warn('Speech recognition error:', event.error);
      }
    };

    return rec;
  }

  function listen() {
    if (isListening) { stop(); return; }
    const rec = buildRecognition();
    if (!rec) return;
    recognition = rec;
    try { recognition.start(); } catch(e) { console.error('Recognition start failed:', e); }
  }

  function stop() {
    if (recognition && isListening) {
      try { recognition.stop(); } catch(e) {}
    }
  }

  // ── Pre-load voices (Chrome loads them async) ─────────────
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    setTimeout(() => window.speechSynthesis.getVoices(), 300);
  }

  // ── Public API ────────────────────────────────────────────
  return { toggleMode, listen, stop, speak, isActive: () => modeActive };
})();

// ── Patch Chat module to speak AI responses ───────────────
// Wait for Chat to exist, then wrap its sendMessage
(function patchChat() {
  const MAX_WAIT = 5000;
  const INTERVAL = 100;
  let waited = 0;

  function tryPatch() {
    // Find the messages area and observe for new AI messages
    const area = document.getElementById('messagesArea');
    if (!area) {
      if (waited < MAX_WAIT) { waited += INTERVAL; setTimeout(tryPatch, INTERVAL); }
      return;
    }

    // MutationObserver: watch for new AI message bubbles
    const observer = new MutationObserver(mutations => {
      if (!Voice.isActive()) return;
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          // Look for ai msg-row
          const isAI = node.classList && node.classList.contains('msg-row') && node.classList.contains('ai');
          const bubble = isAI
            ? node.querySelector('.msg-bubble')
            : node.querySelector('.msg-row.ai .msg-bubble');
          if (bubble) {
            // Small delay so the bubble is fully rendered
            setTimeout(() => Voice.speak(bubble.innerText || bubble.textContent), 200);
          }
        });
      });
    });

    observer.observe(area, { childList: true, subtree: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryPatch);
  } else {
    tryPatch();
  }
})();
