/**
 * EmoCare Profile & Settings Module
 * Handles profile display, name/avatar updates, password change, data export, account deletion
 */

const Profile = (() => {
  // ── State ─────────────────────────────────────────────────
  let userData = null;

  // ── DOM Helpers ───────────────────────────────────────────
  function el(id) { return document.getElementById(id); }

  // ── Init ──────────────────────────────────────────────────
  async function init() {
    const authed = await Auth.requireAuth();
    if (!authed) return;

    await loadProfile();
    bindEvents();
  }

  // ── Load Profile ──────────────────────────────────────────
  async function loadProfile() {
    try {
      const data = await API.getMe();
      userData = data.user || data;

      // Fill profile card
      const avatarEl = el('profileAvatar');
      if (avatarEl) avatarEl.textContent = userData.avatar || '😊';

      const nameEl = el('profileName');
      if (nameEl) nameEl.textContent = userData.name || 'User';

      const emailEl = el('profileEmail');
      if (emailEl) emailEl.textContent = userData.email || '';

      const joinedEl = el('profileJoined');
      if (joinedEl && userData.createdAt) {
        joinedEl.textContent = 'Joined ' + new Date(userData.createdAt).toLocaleDateString('en-IN', {
          month: 'long', year: 'numeric'
        });
      }

      // Fill form fields
      const nameInput = el('profileNameInput');
      if (nameInput) nameInput.value = userData.name || '';

      const emailDisplay = el('profileEmailDisplay');
      if (emailDisplay) emailDisplay.textContent = userData.email || '';

      // Set selected avatar
      const avatarOptions = document.querySelectorAll('.avatar-option');
      avatarOptions.forEach(opt => {
        opt.classList.toggle('selected', opt.textContent === (userData.avatar || '😊'));
      });

      // Load stats
      await loadProfileStats();

    } catch (err) {
      console.error('Failed to load profile:', err);
      if (typeof showError === 'function') showError('Failed to load profile');
    }
  }

  // ── Load Stats ────────────────────────────────────────────
  async function loadProfileStats() {
    try {
      const stats = await API.getDashboardStats();
      const s = stats.stats || stats;

      const statSessions = el('profileStatSessions');
      if (statSessions) statSessions.textContent = s.totalSessions || s.sessions || '0';

      const statEntries = el('profileStatEntries');
      if (statEntries) statEntries.textContent = s.totalEntries || s.journalEntries || '0';

      const statStreak = el('profileStatStreak');
      if (statStreak) statStreak.textContent = s.streak || s.dayStreak || '0';
    } catch {
      // Stats are optional
    }
  }

  // ── Event Binding ─────────────────────────────────────────
  function bindEvents() {
    // Update name
    const nameForm = el('nameForm');
    if (nameForm) {
      nameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateName();
      });
    }

    const updateNameBtn = el('updateNameBtn');
    if (updateNameBtn) {
      updateNameBtn.addEventListener('click', updateName);
    }

    // Avatar selection
    document.querySelectorAll('.avatar-option').forEach(opt => {
      opt.addEventListener('click', () => updateAvatar(opt.textContent));
    });

    // Change password
    const passwordForm = el('passwordForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await changePassword();
      });
    }

    const changePasswordBtn = el('changePasswordBtn');
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener('click', changePassword);
    }

    // Export data
    const exportBtn = el('exportDataBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportData);
    }

    // Delete account
    const deleteBtn = el('deleteAccountBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', deleteAccount);
    }
  }

  // ── Update Name ───────────────────────────────────────────
  async function updateName() {
    const input = el('profileNameInput');
    if (!input) return;

    const name = input.value.trim();
    if (!name) {
      if (typeof showWarning === 'function') showWarning('Name cannot be empty.');
      return;
    }

    try {
      await API.updateProfile({ name });
      userData.name = name;
      API.setUser(userData);

      const nameEl = el('profileName');
      if (nameEl) nameEl.textContent = name;

      if (typeof showSuccess === 'function') showSuccess('Name updated!');
    } catch (err) {
      if (typeof showError === 'function') showError(err.message || 'Failed to update name');
    }
  }

  // ── Update Avatar ─────────────────────────────────────────
  async function updateAvatar(emoji) {
    try {
      await API.updateProfile({ avatar: emoji });
      userData.avatar = emoji;
      API.setUser(userData);

      const avatarEl = el('profileAvatar');
      if (avatarEl) avatarEl.textContent = emoji;

      document.querySelectorAll('.avatar-option').forEach(opt => {
        opt.classList.toggle('selected', opt.textContent === emoji);
      });

      if (typeof showSuccess === 'function') showSuccess('Avatar updated!');
    } catch (err) {
      if (typeof showError === 'function') showError(err.message || 'Failed to update avatar');
    }
  }

  // ── Change Password ───────────────────────────────────────
  async function changePassword() {
    const oldPass = el('currentPassword');
    const newPass = el('newPassword');
    const confirmPass = el('confirmNewPassword');

    if (!oldPass || !newPass || !confirmPass) return;

    const currentPassword = oldPass.value;
    const newPassword = newPass.value;
    const confirmNewPassword = confirmPass.value;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      if (typeof showWarning === 'function') showWarning('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      if (typeof showWarning === 'function') showWarning('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      if (typeof showWarning === 'function') showWarning('New passwords do not match.');
      return;
    }

    try {
      await API.changePassword({ currentPassword, newPassword });
      oldPass.value = '';
      newPass.value = '';
      confirmPass.value = '';
      if (typeof showSuccess === 'function') showSuccess('Password changed successfully!');
    } catch (err) {
      if (typeof showError === 'function') showError(err.message || 'Failed to change password');
    }
  }

  // ── Export Data ───────────────────────────────────────────
  async function exportData() {
    try {
      if (typeof showToast === 'function') showToast('Gathering your data...', 'info');

      const [sessions, journals, moods] = await Promise.allSettled([
        API.getChatSessions(),
        API.getJournalEntries(1, 1000),
        API.getMoodEntries()
      ]);

      const exportObj = {
        exportDate: new Date().toISOString(),
        user: {
          name: userData?.name,
          email: userData?.email,
          joined: userData?.createdAt
        },
        chatSessions: sessions.status === 'fulfilled' ? (sessions.value.sessions || sessions.value) : [],
        journalEntries: journals.status === 'fulfilled' ? (journals.value.entries || journals.value) : [],
        moodEntries: moods.status === 'fulfilled' ? (moods.value.moods || moods.value) : []
      };

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emocare-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (typeof showSuccess === 'function') showSuccess('Data exported successfully!');
    } catch (err) {
      console.error('Export failed:', err);
      if (typeof showError === 'function') showError('Failed to export data');
    }
  }

  // ── Delete Account ────────────────────────────────────────
  async function deleteAccount() {
    const confirmed = confirm(
      '⚠️ Are you sure you want to delete your account?\n\n' +
      'This will permanently delete:\n' +
      '• All chat sessions\n' +
      '• All journal entries\n' +
      '• All mood data\n' +
      '• Your account\n\n' +
      'This action CANNOT be undone.'
    );

    if (!confirmed) return;

    // Double confirmation
    const doubleConfirm = confirm('This is your final warning. Delete everything?');
    if (!doubleConfirm) return;

    try {
      await API.deleteAccount();
      API.removeToken();
      if (typeof showSuccess === 'function') showSuccess('Account deleted. We\'re sorry to see you go.');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      if (typeof showError === 'function') showError(err.message || 'Failed to delete account');
    }
  }

  // ── Auto-init ─────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    loadProfile,
    updateName,
    updateAvatar,
    changePassword,
    exportData,
    deleteAccount
  };
})();
