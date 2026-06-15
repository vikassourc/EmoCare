/**
 * EmoCare Chat Module
 * Handles chat sessions, messaging, mood selection, typing indicators
 * Uses backend API instead of direct Anthropic calls
 */

const Chat = (() => {
  // ── State ─────────────────────────────────────────────────
  let currentSessionId = null;
  let conversationHistory = [];
  let isLoading = false;
  let selectedMood = null;

  // ── DOM Helpers ───────────────────────────────────────────
  function el(id) { return document.getElementById(id); }

  // ── Init ──────────────────────────────────────────────────
  async function init() {
    const authed = await Auth.requireAuth();
    if (!authed) return;

    bindEvents();
    await loadSessions();

    // Try to load the most recent session, or create a new one
    const sessions = await API.getChatSessions();
    const sessionList = sessions.sessions || sessions || [];
    if (sessionList.length > 0) {
      await loadSession(sessionList[0]._id || sessionList[0].id);
    } else {
      await createSession();
    }
  }

  // ── Event Binding ─────────────────────────────────────────
  function bindEvents() {
    // Send button
    const sendBtn = el('sendBtn');
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);

    // Chat input
    const chatInput = el('chatInput');
    if (chatInput) {
      chatInput.addEventListener('input', () => autoResize(chatInput));
      chatInput.addEventListener('keydown', handleKey);
    }

    // New session button
    const newSessionBtn = document.querySelector('.topbar-btn');
    if (newSessionBtn && newSessionBtn.textContent.includes('New session')) {
      newSessionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        createSession();
      });
    }

    // Mood chips
    document.querySelectorAll('.mood-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const mood = chip.textContent.trim().split('\n').pop().trim();
        quickMood(chip, mood);
      });
    });

    // Sidebar toggle for mobile
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        document.querySelector('.chat-sidebar').classList.toggle('open');
      });
    }
  }

  // ── Mood Selection ────────────────────────────────────────
  function quickMood(chipEl, mood) {
    document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('selected'));
    chipEl.classList.add('selected');
    selectedMood = mood;
    const input = el('chatInput');
    if (input) {
      input.value = `I'm feeling ${mood} today.`;
      input.focus();
      autoResize(input);
    }
  }

  // ── Sessions ──────────────────────────────────────────────
  async function loadSessions() {
    try {
      const data = await API.getChatSessions();
      const sessions = data.sessions || data || [];
      renderSessionsList(sessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }

  function renderSessionsList(sessions) {
    const container = el('sessionsList') || document.querySelector('.sidebar-history');
    if (!container) return;

    // Keep the h4 header if it exists
    const header = container.querySelector('h4');
    container.innerHTML = '';
    if (header) container.appendChild(header);

    if (!sessions.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:16px;text-align:center;color:var(--text-soft);font-size:13px;';
      empty.textContent = 'No sessions yet';
      container.appendChild(empty);
      return;
    }

    sessions.forEach(session => {
      const item = document.createElement('div');
      item.className = 'history-item' + ((session._id || session.id) === currentSessionId ? ' active' : '');
      item.dataset.sessionId = session._id || session.id;

      const title = session.title || session.name ||
        new Date(session.createdAt || session.created_at).toLocaleDateString('en-IN', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

      item.innerHTML = `
        <span class="history-item-text">${title}</span>
        <button class="history-delete-btn" title="Delete session">&times;</button>
      `;

      // Click to load
      item.querySelector('.history-item-text')?.addEventListener('click', () => {
        loadSession(session._id || session.id);
      });
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('history-delete-btn')) {
          loadSession(session._id || session.id);
        }
      });

      // Delete button
      item.querySelector('.history-delete-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSession(session._id || session.id);
      });

      container.appendChild(item);
    });
  }

  async function createSession() {
    try {
      const data = await API.createChatSession();
      const session = data.session || data;
      currentSessionId = session._id || session.id;
      conversationHistory = [];

      clearMessagesArea();
      appendMessage('ai', 'Starting a fresh session 🌿\n\nWhat would you like to talk about today?');
      await loadSessions();

      if (typeof showSuccess === 'function') showSuccess('New session started');
    } catch (err) {
      console.error('Failed to create session:', err);
      if (typeof showError === 'function') showError('Failed to create session');
    }
  }

  async function loadSession(id) {
    try {
      currentSessionId = id;
      const data = await API.getChatSession(id);
      const session = data.session || data;
      const messages = session.messages || data.messages || [];

      clearMessagesArea();
      conversationHistory = [];

      if (messages.length === 0) {
        appendMessage('ai', 'Hi there 🌿 I\'m EmoCare — your personal emotional companion.\n\nI\'m here to listen without judgment, help you understand your feelings, and gently guide you toward feeling better.\n\nHow are you feeling right now?');
      } else {
        messages.forEach(msg => {
          const role = msg.role === 'assistant' ? 'ai' : msg.role;
          if (role === 'user' || role === 'ai') {
            const { text, insight } = parseInsight(msg.content || msg.text || '');
            appendMessage(role, text, insight);
            conversationHistory.push({
              role: msg.role === 'ai' ? 'assistant' : msg.role,
              content: msg.content || msg.text || ''
            });
          }
        });
      }

      // Update active state in sidebar
      document.querySelectorAll('.history-item').forEach(item => {
        item.classList.toggle('active', item.dataset.sessionId === id);
      });

      // Close sidebar on mobile
      document.querySelector('.chat-sidebar')?.classList.remove('open');

    } catch (err) {
      console.error('Failed to load session:', err);
      if (typeof showError === 'function') showError('Failed to load session');
    }
  }

  async function deleteSession(id) {
    if (!confirm('Delete this session?')) return;
    try {
      await API.deleteChatSession(id);
      if (currentSessionId === id) {
        currentSessionId = null;
        clearMessagesArea();
        appendMessage('ai', 'Session deleted. Start a new one when you\'re ready 🌿');
      }
      await loadSessions();
      if (typeof showSuccess === 'function') showSuccess('Session deleted');
    } catch (err) {
      console.error('Failed to delete session:', err);
      if (typeof showError === 'function') showError('Failed to delete session');
    }
  }

  // ── Send Message ──────────────────────────────────────────
  async function sendMessage() {
    if (isLoading) return;
    const input = el('chatInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    // If no session, create one first
    if (!currentSessionId) {
      await createSession();
    }

    // Show user message
    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    input.value = '';
    autoResize(input);
    isLoading = true;

    const sendBtn = el('sendBtn');
    if (sendBtn) sendBtn.disabled = true;

    showTyping();

    try {
      const response = await API.sendChatMessage({
        sessionId: currentSessionId,
        message: text,
        mood: selectedMood
      });

      removeTyping();

      // Server returns { success, response, insight, sessionId }
      if (!response.success) {
        throw new Error(response.error || response.message || 'AI response failed');
      }

      const rawText = response.response || response.message || response.reply || response.content || '';

      if (!rawText) {
        throw new Error('Empty response from AI');
      }

      const { text: cleanText, insight } = parseInsight(rawText);
      conversationHistory.push({ role: 'assistant', content: rawText });
      appendMessage('ai', cleanText, insight);

    } catch (err) {
      removeTyping();
      const errMsg = err.message || 'Connection error';
      // Show friendly message to user
      appendMessage('ai', "I'm having a moment of difficulty connecting. Please try again in a moment — I'm here for you. 💚");
      console.error('Chat error:', errMsg);
      if (typeof showError === 'function') showError(errMsg.includes('rate') || errMsg.includes('quota')
        ? 'AI is busy, please wait a moment'
        : 'Failed to send message');
    } finally {
      isLoading = false;
      if (sendBtn) sendBtn.disabled = false;
      input.focus();
    }
  }

  // ── Message Rendering ────────────────────────────────────
  function appendMessage(role, text, insightData) {
    const area = el('messagesArea');
    if (!area) return;

    const row = document.createElement('div');
    row.className = `msg-row ${role}`;

    let html = '';
    if (role === 'ai') {
      html += `<div class="msg-avatar"><img class="msg-avatar-img" src="assets/emologo.jpg" alt="AI"></div>`;
    }

    html += `<div>
      <div class="msg-bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>`;

    if (insightData) {
      const causes = insightData.possible_causes
        .map(c => `<span class="insight-tag">${escapeHtml(c)}</span>`).join('');
      const recs = insightData.recommendations
        .map(r => `<span class="insight-tag">✓ ${escapeHtml(r)}</span>`).join('');
      html += `
      <div class="insight-pill">
        <div class="insight-title">🧠 Emotional Insight</div>
        <div><strong>${escapeHtml(insightData.emotion)}</strong> · Intensity: <strong>${escapeHtml(insightData.intensity)}</strong></div>
        <div class="insight-tags">${causes}</div>
        <div class="insight-tags">${recs}</div>
        ${insightData.reflection_question ? `<div style="margin-top:8px;font-style:italic;color:#6b8278;">💭 ${escapeHtml(insightData.reflection_question)}</div>` : ''}
      </div>`;
    }

    html += '</div>';
    row.innerHTML = html;
    area.appendChild(row);
    area.scrollTop = area.scrollHeight;
  }

  function clearMessagesArea() {
    const area = el('messagesArea');
    if (area) area.innerHTML = '';
  }

  // ── Parse Insight ─────────────────────────────────────────
  function parseInsight(text) {
    if (!text || !text.includes('INSIGHT_START')) return { text, insight: null };

    const before = text.split('INSIGHT_START')[0].trim();
    const insightRaw = text.split('INSIGHT_START')[1].split('INSIGHT_END')[0].trim();

    const lines = {};
    insightRaw.split('\n').forEach(line => {
      const [key, ...val] = line.split(':');
      if (key && val.length) lines[key.trim()] = val.join(':').trim();
    });

    const insight = {
      emotion: lines['emotion'] || '',
      intensity: lines['intensity'] || '',
      possible_causes: (lines['possible_causes'] || '').split('|').map(s => s.trim()).filter(Boolean),
      recommendations: (lines['recommendations'] || '').split('|').map(s => s.trim()).filter(Boolean),
      reflection_question: lines['reflection_question'] || ''
    };

    return { text: before, insight };
  }

  // ── Typing Indicator ──────────────────────────────────────
  function showTyping() {
    const area = el('messagesArea');
    if (!area) return;

    const row = document.createElement('div');
    row.className = 'msg-row ai';
    row.id = 'typingRow';
    row.innerHTML = `
      <div class="msg-avatar"><img class="msg-avatar-img" src="assets/emologo.jpg" alt="AI"></div>
      <div class="typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>`;
    area.appendChild(row);
    area.scrollTop = area.scrollHeight;
  }

  function removeTyping() {
    const typing = el('typingRow');
    if (typing) typing.remove();
  }

  // ── Utilities ─────────────────────────────────────────────
  function autoResize(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ── Auto-init ─────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    sendMessage,
    createSession,
    loadSession,
    deleteSession,
    quickMood
  };
})();
