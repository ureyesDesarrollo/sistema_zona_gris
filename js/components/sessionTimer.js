// components/sessionTimer.js
export const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 min
export const TICK_MS = 1000;

export let isExpired = false;
let lastActivity = Date.now();
let inactivityTimeout = null;
let tickInterval = null;

export function refreshSession() {
  if (isExpired) return false;
  lastActivity = Date.now();
  startInactivityTimer();
  startTick();
  return true;
}

const activityEvents = [
  'mousemove', 'keydown', 'mousedown', 'click',
  'scroll', 'touchstart', 'touchmove'
];

function formatMMSS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function renderTimer(remainingMs) {
  const html = `
    <div class="session-timer">
      <span class="badge bg-primary-gradient" style="font-size:0.95rem; padding:.65rem .8rem;">
        <span class="timer-text me-1">Tiempo de sesión:</span>
        <span class="timer-value"><b>${formatMMSS(remainingMs)}</b></span>
      </span>
    </div>`;
  const container = document.getElementById('sessionTimer');
  if (container) container.innerHTML = html;
}

function showSessionExpiredUI() {
  const overlay = document.getElementById('sessionOverlay');
  if (overlay) {
    overlay.classList.remove('d-none');
    document.body.classList.add('overflow-hidden');
  }

  const toastEl = document.getElementById('sessionToast');
  if (toastEl && window.bootstrap?.Toast) {
    toastEl.querySelector("[data-bs-dismiss='toast']")?.remove();
    toastEl.querySelector(".btn-close")?.remove();
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { autohide: false, animation: true });
    toast.show();
  }

  const goLoginBtn = document.querySelector('.btn-session-login');
  if (goLoginBtn) {
    goLoginBtn.addEventListener('click', () => { window.location.href = 'index.html'; }, { once: true });
  }
}

export function handleActivity() {
  if (isExpired) return;
  lastActivity = Date.now();
  startInactivityTimer();
}

export function attachActivityListeners() {
  activityEvents.forEach(evt =>
    document.addEventListener(evt, handleActivity, { passive: true })
  );
}

export function detachActivityListeners() {
  activityEvents.forEach(evt =>
    document.removeEventListener(evt, handleActivity)
  );
}

export function startInactivityTimer() {
  clearTimeout(inactivityTimeout);
  inactivityTimeout = setTimeout(() => logout(), SESSION_DURATION_MS);
}

export function startTick() {
  clearInterval(tickInterval);
  tickInterval = setInterval(() => {
    if (isExpired) return;
    const elapsed = Date.now() - lastActivity;
    const remaining = SESSION_DURATION_MS - elapsed;
    if (remaining <= 0) {
      logout();
      return;
    }
    renderTimer(remaining);
  }, TICK_MS);
}

export function logout({ manual = false } = {}) {
  if (isExpired) return; // evita múltiples ejecuciones

  isExpired = true;
  localStorage.removeItem('usuario');

  clearInterval(tickInterval);
  clearTimeout(inactivityTimeout);
  detachActivityListeners();

  renderTimer(0);

  if (manual || localStorage.getItem('logout') === 'true') {
    localStorage.removeItem('logout');
    window.location.href = 'index.html';
    return;
  }
  showSessionExpiredUI();
}
