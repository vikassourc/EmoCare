/**
 * EmoCare Authentication Module
 * Handles login, signup, token validation, nav updates, and route protection
 */

const Auth = (() => {
  // ── State ───────────────────────────────────────────────
  let currentUser = null;

  // ── Token Checks ────────────────────────────────────────
  function isAuthenticated() {
    return !!API.getToken();
  }

  async function validateToken() {
    if (!API.getToken()) return false;
    try {
      const data = await API.getMe();
      currentUser = data.user || data;
      API.setUser(currentUser);
      return true;
    } catch {
      API.removeToken();
      return false;
    }
  }

  // ── Route Protection ──────────────────────────────────────
  async function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = '/login.html';
      return false;
    }
    const valid = await validateToken();
    if (!valid) {
      window.location.href = '/login.html';
      return false;
    }
    updateNavForAuth();
    return true;
  }

  // ── Logout ────────────────────────────────────────────────
  function logout() {
    API.removeToken();
    currentUser = null;
    window.location.href = '/';
  }

  // ── Nav Updates ───────────────────────────────────────────
  function updateNavForAuth() {
    const user = currentUser || API.getUser();
    if (!user) return;

    // Find the nav-right area or the last btn-primary in nav
    const navs = document.querySelectorAll('.nav, .dashboard-nav');

    navs.forEach(nav => {
      // Remove existing "Start Talking" / "Get Started" / "New session" / "Open chat" link buttons
      const existingBtn = nav.querySelector('.btn-primary');
      const existingUserMenu = nav.querySelector('.user-menu');

      // Don't re-create if already exists
      if (existingUserMenu) return;

      // Create the user menu
      const userMenu = document.createElement('div');
      userMenu.className = 'user-menu';

      const avatar = user.avatar || '😊';
      const name = user.name || user.email || 'User';

      userMenu.innerHTML = `
        <button class="user-avatar-btn" title="${name}">${avatar}</button>
        <div class="user-dropdown" id="userDropdown">
          <div class="user-dropdown-name">${name}</div>
          <a href="/dashboard.html" class="dropdown-item">📊 Dashboard</a>
          <a href="/journal.html" class="dropdown-item">📓 Journal</a>
          <a href="/chat.html" class="dropdown-item">💬 Chat</a>
          <a href="/breathe.html" class="dropdown-item">🌬️ Breathe</a>
          <a href="/profile.html" class="dropdown-item">⚙️ Profile</a>
          <hr style="border:none;border-top:1px solid rgba(61,140,120,0.1);margin:4px 0;">
          <button class="dropdown-item logout-btn" style="color:#ef4444;">🚪 Logout</button>
        </div>
      `;

      // Replace existing button or append
      if (existingBtn) {
        existingBtn.replaceWith(userMenu);
      } else {
        nav.appendChild(userMenu);
      }

      // Toggle dropdown
      const avatarBtn = userMenu.querySelector('.user-avatar-btn');
      const dropdown = userMenu.querySelector('.user-dropdown');

      avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      // Logout handler
      const logoutBtn = userMenu.querySelector('.logout-btn');
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });

      // Close dropdown on outside click
      document.addEventListener('click', () => {
        dropdown.classList.remove('show');
      });
    });
  }

  // ── Login Page Logic ──────────────────────────────────────
  function initLoginPage() {
    // If already logged in, redirect to dashboard
    if (isAuthenticated()) {
      window.location.href = '/dashboard.html';
      return;
    }

    // Tab switching
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginTab && signupTab) {
      loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        clearErrors();
      });

      signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        clearErrors();
      });
    }

    // Login form
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
          showFormError('loginError', 'Please fill in all fields.');
          return;
        }

        const submitBtn = loginForm.querySelector('.auth-submit');
        setLoading(submitBtn, true);

        try {
          const data = await API.login({ email, password });
          API.setToken(data.token);
          API.setUser(data.user);
          if (typeof showSuccess === 'function') showSuccess('Welcome back!');
          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 500);
        } catch (err) {
          showFormError('loginError', err.message || 'Login failed. Please try again.');
          if (typeof showError === 'function') showError(err.message || 'Login failed');
        } finally {
          setLoading(submitBtn, false);
        }
      });
    }

    // Signup form
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirm').value;

        if (!name || !email || !password) {
          showFormError('signupError', 'Please fill in all fields.');
          return;
        }

        if (password.length < 6) {
          showFormError('signupError', 'Password must be at least 6 characters.');
          return;
        }

        if (password !== confirmPassword) {
          showFormError('signupError', 'Passwords do not match.');
          return;
        }

        const submitBtn = signupForm.querySelector('.auth-submit');
        setLoading(submitBtn, true);

        try {
          const data = await API.signup({ name, email, password });
          API.setToken(data.token);
          API.setUser(data.user);
          if (typeof showSuccess === 'function') showSuccess('Account created! Welcome to EmoCare 🌿');
          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 500);
        } catch (err) {
          showFormError('signupError', err.message || 'Signup failed. Please try again.');
          if (typeof showError === 'function') showError(err.message || 'Signup failed');
        } finally {
          setLoading(submitBtn, false);
        }
      });
    }

    // Google Sign-In
    initGoogleSignIn();
  }

  // ── Google Sign-In ──────────────────────────────────────────
  function initGoogleSignIn() {
    const container = document.getElementById('googleBtnContainer');
    if (!container) return;

    // Wait for Google SDK to load
    const tryInit = () => {
      if (typeof google === 'undefined' || !google.accounts) {
        setTimeout(tryInit, 200);
        return;
      }

      google.accounts.id.initialize({
        client_id: window.GOOGLE_CLIENT_ID || '',
        callback: handleGoogleResponse,
        auto_select: false,
      });

      google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width: 360,
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'center',
      });
    };

    // Fetch Google Client ID from server config
    fetch('/api/auth/google-client-id')
      .then(r => r.json())
      .then(data => {
        if (data.clientId) {
          window.GOOGLE_CLIENT_ID = data.clientId;
          tryInit();
        }
      })
      .catch(() => {
        // If endpoint doesn't exist, try init anyway (might have client_id hardcoded)
        tryInit();
      });
  }

  async function handleGoogleResponse(response) {
    try {
      const data = await API.googleLogin(response.credential);
      API.setToken(data.token);
      API.setUser(data.user);
      const msg = data.isNewUser ? 'Account created with Google! 🌿' : 'Welcome back!';
      if (typeof showSuccess === 'function') showSuccess(msg);
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 500);
    } catch (err) {
      if (typeof showError === 'function') showError(err.message || 'Google login failed');
    }
  }

  // ── Helper Functions ──────────────────────────────────────
  function showFormError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = message;
      el.style.display = 'block';
    }
  }

  function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = 'Please wait...';
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.originalText || 'Submit';
      btn.disabled = false;
    }
  }

  function getUser() {
    return currentUser || API.getUser();
  }

  // ── Hamburger Menu ────────────────────────────────────────
  function initHamburger() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('open');
      });

      // Close on link click
      navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          navLinks.classList.remove('open');
        });
      });
    }
  }

  // ── Landing Page Nav ──────────────────────────────────────
  function updateLandingNav() {
    if (isAuthenticated()) {
      const user = API.getUser();
      if (user) {
        currentUser = user;
        updateNavForAuth();
      } else {
        validateToken().then(valid => {
          if (valid) updateNavForAuth();
        });
      }
    }
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    initHamburger();

    // Detect if we're on the login page
    const isLoginPage = window.location.pathname.includes('login');
    if (isLoginPage) {
      initLoginPage();
      return;
    }

    // Update nav on all pages for logged-in users
    updateLandingNav();
  }

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    isAuthenticated,
    validateToken,
    requireAuth,
    logout,
    getUser,
    updateNavForAuth,
    initLoginPage,
    initHamburger
  };
})();
