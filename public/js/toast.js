/**
 * EmoCare Toast Notification System
 * Supports: success, error, warning, info
 * Features: auto-dismiss, progress bar, stacking, slide animations
 */

const ToastManager = (() => {
  let container = null;

  const ICONS = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const COLORS = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  function ensureContainer() {
    if (container && document.body.contains(container)) return container;
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  function showToast(message, type = 'info', duration = 4000) {
    const wrapper = ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.position = 'relative';
    toast.style.overflow = 'hidden';

    // Icon
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = ICONS[type] || ICONS.info;
    icon.style.color = COLORS[type] || COLORS.info;

    // Message
    const msg = document.createElement('span');
    msg.className = 'toast-message';
    msg.textContent = message;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => dismissToast(toast));

    // Progress bar
    const progress = document.createElement('div');
    progress.className = 'toast-progress';
    progress.style.width = '100%';
    progress.style.transition = `width ${duration}ms linear`;

    toast.appendChild(icon);
    toast.appendChild(msg);
    toast.appendChild(closeBtn);
    toast.appendChild(progress);

    // Insert at top (newest first)
    wrapper.insertBefore(toast, wrapper.firstChild);

    // Trigger progress bar animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        progress.style.width = '0%';
      });
    });

    // Auto-dismiss
    const timer = setTimeout(() => dismissToast(toast), duration);
    toast._timer = timer;

    return toast;
  }

  function dismissToast(toast) {
    if (!toast || toast._dismissed) return;
    toast._dismissed = true;
    clearTimeout(toast._timer);
    toast.style.animation = 'toastSlideOut 0.3s ease forwards';
    toast.addEventListener('animationend', () => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
  }

  return { showToast, dismissToast };
})();

// Global convenience functions
function showToast(message, type = 'info', duration = 4000) {
  return ToastManager.showToast(message, type, duration);
}

function showSuccess(message, duration = 4000) {
  return ToastManager.showToast(message, 'success', duration);
}

function showError(message, duration = 5000) {
  return ToastManager.showToast(message, 'error', duration);
}

function showWarning(message, duration = 4500) {
  return ToastManager.showToast(message, 'warning', duration);
}
