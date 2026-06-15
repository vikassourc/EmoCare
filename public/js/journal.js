/**
 * EmoCare Journal Module
 * Backend-persistent journaling with AI prompts and feedback
 */

const Journal = (() => {
  // ── State ─────────────────────────────────────────────────
  let currentEntryId = null;
  let currentPage = 1;

  // Static fallback prompts
  const STATIC_PROMPTS = [
    "What is one emotion you've been avoiding lately, and what do you think it's trying to tell you?",
    "Describe a moment this week when you felt truly at peace. What made it possible?",
    "What belief about yourself do you wish you could let go of?",
    "If your anxiety could speak, what would it say? What would you reply?",
    "What does 'taking care of yourself' mean to you right now?",
    "Who in your life makes you feel truly seen? How do they do it?",
    "What would you tell your younger self about this phase of life?",
    "Write about a challenge you overcame. What did it teach you?",
    "What are you most proud of this week — no matter how small?",
    "What kind of person do you want to become in the next year?",
  ];
  let promptIndex = 0;

  // ── DOM Helpers ───────────────────────────────────────────
  function el(id) { return document.getElementById(id); }

  // ── Init ──────────────────────────────────────────────────
  async function init() {
    const authed = await Auth.requireAuth();
    if (!authed) return;

    // Set date
    const now = new Date();
    const dateEl = el('entryDate');
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }

    bindEvents();
    await renderEntries();
  }

  // ── Event Binding ─────────────────────────────────────────
  function bindEvents() {
    // Word count on input
    const textarea = el('journalTextarea');
    if (textarea) {
      textarea.addEventListener('input', updateWordCount);
    }

    // New prompt button
    const promptBtns = document.querySelectorAll('.prompt-btn');
    promptBtns.forEach(btn => {
      if (btn.textContent.includes('New prompt')) {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', getNewPrompt);
      }
      if (btn.textContent.includes('Write about this')) {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', usePrompt);
      }
    });

    // Save button
    const saveBtn = document.querySelector('[onclick="saveEntry()"]');
    if (saveBtn) {
      saveBtn.removeAttribute('onclick');
      saveBtn.addEventListener('click', saveEntry);
    }

    // AI feedback button
    const feedbackBtn = document.querySelector('[onclick="getAIFeedback()"]');
    if (feedbackBtn) {
      feedbackBtn.removeAttribute('onclick');
      feedbackBtn.addEventListener('click', getAIFeedback);
    }

    // Also bind by checking button text content
    document.querySelectorAll('.editor-footer button').forEach(btn => {
      const text = btn.textContent.trim();
      if (text.includes('AI reflection')) {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', getAIFeedback);
      }
      if (text.includes('Save entry')) {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', saveEntry);
      }
    });
  }

  // ── Prompts ───────────────────────────────────────────────
  async function getNewPrompt() {
    const promptText = el('currentPrompt');
    const btn = document.querySelector('.prompt-btn');
    if (btn) btn.textContent = '⏳ Getting prompt...';

    try {
      const data = await API.getJournalPrompt();
      const prompt = data.prompt || data.text || data.content;
      if (prompt && promptText) {
        promptText.textContent = prompt;
      }
    } catch (err) {
      // Fallback to static prompts
      promptIndex = (promptIndex + 1) % STATIC_PROMPTS.length;
      if (promptText) promptText.textContent = STATIC_PROMPTS[promptIndex];
    }

    if (btn) btn.textContent = '🔄 New prompt';
  }

  function usePrompt() {
    const promptText = el('currentPrompt');
    const textarea = el('journalTextarea');
    if (!promptText || !textarea) return;

    textarea.value = `Prompt: ${promptText.textContent}\n\n`;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    updateWordCount();
    textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ── Word Count ────────────────────────────────────────────
  function updateWordCount() {
    const textarea = el('journalTextarea');
    const counter = el('wordCount');
    if (!textarea || !counter) return;

    const text = textarea.value.trim();
    const words = text ? text.split(/\s+/).length : 0;
    counter.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  }

  // ── Save Entry ────────────────────────────────────────────
  async function saveEntry() {
    const textarea = el('journalTextarea');
    if (!textarea) return;

    const text = textarea.value.trim();
    if (!text) {
      if (typeof showWarning === 'function') showWarning('Please write something before saving.');
      return;
    }

    const mood = el('moodSelect')?.value || '';
    const wordCount = text.split(/\s+/).length;
    const promptText = el('currentPrompt')?.textContent || '';

    try {
      const data = await API.createJournalEntry({
        text,
        content: text,
        mood,
        prompt: promptText,
        wordCount
      });

      currentEntryId = data.entry?._id || data.entry?.id || data._id || data.id;

      textarea.value = '';
      if (el('moodSelect')) el('moodSelect').value = '';
      updateWordCount();

      await renderEntries();
      if (typeof showSuccess === 'function') showSuccess('Entry saved! ✨');

      return currentEntryId;
    } catch (err) {
      console.error('Failed to save entry:', err);
      if (typeof showError === 'function') showError(err.message || 'Failed to save entry');
      return null;
    }
  }

  // ── AI Feedback ───────────────────────────────────────────
  async function getAIFeedback() {
    const textarea = el('journalTextarea');
    if (!textarea) return;

    const text = textarea.value.trim();
    if (!text || text.length < 20) {
      if (typeof showWarning === 'function') showWarning('Please write at least a few sentences first.');
      return;
    }

    const area = el('aiFeedbackArea');
    const content = el('aiFeedbackContent');
    if (!area || !content) return;

    area.classList.remove('hidden');
    content.innerHTML = '<div class="skeleton skeleton-text" style="width:100%;"></div><div class="skeleton skeleton-text" style="width:90%;"></div><div class="skeleton skeleton-text" style="width:80%;"></div>';
    area.scrollIntoView({ behavior: 'smooth' });

    // Save first if no current entry
    let entryId = currentEntryId;
    if (!entryId) {
      entryId = await saveEntry();
      if (!entryId) {
        content.textContent = 'Please save the entry first.';
        return;
      }
    }

    try {
      const data = await API.getJournalFeedback(entryId);
      const feedback = data.feedback || data.content || data.text || data.reflection || '';
      content.innerHTML = feedback.replace(/\n/g, '<br>');
      if (typeof showSuccess === 'function') showSuccess('AI reflection ready');
    } catch (err) {
      content.textContent = 'Unable to generate feedback right now. Please try again.';
      if (typeof showError === 'function') showError(err.message || 'Feedback failed');
    }
  }

  // ── Render Entries ────────────────────────────────────────
  async function renderEntries() {
    const list = el('entryList');
    const countEl = el('entryCount');
    if (!list) return;

    try {
      const data = await API.getJournalEntries(currentPage);
      const entries = data.entries || data.journals || data || [];
      const total = data.total || entries.length;

      if (countEl) countEl.textContent = `${total} entr${total !== 1 ? 'ies' : 'y'}`;

      if (!entries.length) {
        list.innerHTML = `
          <div style="text-align:center;padding:40px;color:var(--text-soft);">
            <div style="font-size:40px;margin-bottom:12px;">📓</div>
            <p>No entries yet. Write your first one above!</p>
          </div>`;
        return;
      }

      list.innerHTML = entries.map(entry => {
        const id = entry._id || entry.id;
        const date = new Date(entry.date || entry.createdAt || entry.created_at)
          .toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const preview = entry.preview || (entry.text || entry.content || '').substring(0, 120) + '...';
        const mood = entry.mood || '';

        return `
          <div class="entry-item" data-id="${id}">
            <div style="display:flex;justify-content:space-between;align-items:start;">
              <div class="entry-date">${date}</div>
              <button class="entry-delete-btn" data-id="${id}" title="Delete entry" style="background:none;border:none;cursor:pointer;color:var(--text-soft);font-size:16px;padding:0 4px;">&times;</button>
            </div>
            <div class="entry-preview">${escapeHtml(preview)}</div>
            ${mood ? `<span class="entry-mood">${escapeHtml(mood)}</span>` : ''}
          </div>`;
      }).join('');

      // Bind click to load
      list.querySelectorAll('.entry-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (e.target.classList.contains('entry-delete-btn')) return;
          const id = item.dataset.id;
          loadEntry(id);
        });
      });

      // Bind delete buttons
      list.querySelectorAll('.entry-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteEntry(btn.dataset.id);
        });
      });

    } catch (err) {
      console.error('Failed to load entries:', err);
      list.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-soft);">
          <p>Unable to load entries. Please try again.</p>
        </div>`;
    }
  }

  // ── Load Entry ────────────────────────────────────────────
  async function loadEntry(id) {
    try {
      const data = await API.getJournalEntry(id);
      const entry = data.entry || data;

      const textarea = el('journalTextarea');
      if (textarea) {
        textarea.value = entry.text || entry.content || '';
        updateWordCount();
      }

      const moodSelect = el('moodSelect');
      if (moodSelect && entry.mood) moodSelect.value = entry.mood;

      currentEntryId = id;
      textarea?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to load entry:', err);
      if (typeof showError === 'function') showError('Failed to load entry');
    }
  }

  // ── Delete Entry ──────────────────────────────────────────
  async function deleteEntry(id) {
    if (!confirm('Delete this journal entry? This cannot be undone.')) return;

    try {
      await API.deleteJournalEntry(id);
      if (currentEntryId === id) {
        currentEntryId = null;
        const textarea = el('journalTextarea');
        if (textarea) textarea.value = '';
        updateWordCount();
      }
      await renderEntries();
      if (typeof showSuccess === 'function') showSuccess('Entry deleted');
    } catch (err) {
      console.error('Failed to delete entry:', err);
      if (typeof showError === 'function') showError('Failed to delete entry');
    }
  }

  // ── Utilities ─────────────────────────────────────────────
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

  // Expose globally for inline onclick fallback
  window.getNewPrompt = getNewPrompt;
  window.usePrompt = usePrompt;
  window.saveEntry = saveEntry;
  window.getAIFeedback = getAIFeedback;
  window.updateWordCount = updateWordCount;

  return {
    getNewPrompt,
    usePrompt,
    saveEntry,
    getAIFeedback,
    renderEntries,
    loadEntry,
    deleteEntry
  };
})();
