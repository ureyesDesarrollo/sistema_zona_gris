// js/components/sessionTimer.js
export const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 min
export const TICK_MS = 1000;

export let isExpired = false;
let lastActivity = Date.now();
let inactivityTimeoutId = null;
let tickIntervalId = null;

// Eventos que reinician la cuenta atrás de inactividad
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'click', 'scroll', 'touchstart', 'touchmove'];
// Elementos del DOM
const timerContainer = document.getElementById('sessionTimer');
const sessionOverlay = document.getElementById('sessionOverlay');
const sessionToast = document.getElementById('sessionToast');
const goLoginBtn = document.querySelector('.btn-session-login');

/**
 * Formatea milisegundos a un string "mm:ss".
 * @param {number} ms Milisegundos a formatear.
 * @returns {string} El tiempo formateado.
 */
function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Renderiza el temporizador en la UI.
 * @param {number} remainingMs El tiempo restante en milisegundos.
 */
export function renderTimer(remainingMs) {
  if (!timerContainer) return;
  const formattedTime = formatTime(remainingMs);
  timerContainer.innerHTML = `
    <div class="session-timer">
      <span class="badge bg-primary-gradient" style="font-size:0.95rem; padding:.65rem .8rem;">
        <span class="timer-text me-1">Tiempo de sesión:</span>
        <span class="timer-value"><b>${formattedTime}</b></span>
      </span>
    </div>
  `;
}

/**
 * Muestra la UI de sesión expirada.
 */
function showExpiredUI() {
  if (sessionOverlay) {
    sessionOverlay.classList.remove('d-none');
    document.body.classList.add('overflow-hidden');
  }

  if (sessionToast && window.bootstrap?.Toast) {
    const toastInstance = window.bootstrap.Toast.getOrCreateInstance(sessionToast, { autohide: false, animation: true });
    toastInstance.show();
  }
}

/**
 * Reinicia la cuenta atrás de inactividad y la marca de última actividad.
 */
export function handleActivity() {
  if (isExpired) return;
  lastActivity = Date.now();
  startInactivityTimer();
}

/**
 * Asocia los 'event listeners' para detectar la actividad del usuario.
 */
export function attachActivityListeners() {
  ACTIVITY_EVENTS.forEach(event => {
    document.addEventListener(event, handleActivity, { passive: true });
  });
  if (goLoginBtn) {
    goLoginBtn.addEventListener('click', () => { window.location.href = 'index.html'; }, { once: true });
  }
}

/**
 * Desasocia los 'event listeners' para la actividad del usuario.
 */
export function detachActivityListeners() {
  ACTIVITY_EVENTS.forEach(event => {
    document.removeEventListener(event, handleActivity);
  });
}

/**
 * Inicia o reinicia el temporizador de inactividad.
 */
export function startInactivityTimer() {
  clearTimeout(inactivityTimeoutId);
  inactivityTimeoutId = setTimeout(logout, SESSION_DURATION_MS);
}

/**
 * Inicia el intervalo para actualizar el temporizador cada segundo.
 */
export function startTick() {
  clearInterval(tickIntervalId);
  tickIntervalId = setInterval(() => {
    if (isExpired) {
      clearInterval(tickIntervalId);
      return;
    }
    const remaining = SESSION_DURATION_MS - (Date.now() - lastActivity);
    if (remaining <= 0) {
      logout();
      return;
    }
    renderTimer(remaining);
  }, TICK_MS);
}

/**
 * Refresca la sesión, reiniciando los temporizadores.
 * @returns {boolean} True si se pudo refrescar, false si ya había expirado.
 */
export function refreshSession() {
  if (isExpired) return false;
  handleActivity(); // Reinicia la actividad
  startTick(); // Reinicia el contador de tiempo
  return true;
}

/**
 * Cierra la sesión del usuario.
 * @param {Object} [options] Opciones para el cierre de sesión.
 * @param {boolean} [options.manual=false] Indica si el cierre es manual.
 */
export function logout({ manual = false } = {}) {
  if (isExpired) return;

  isExpired = true;
  localStorage.removeItem('usuario');

  clearInterval(tickIntervalId);
  clearTimeout(inactivityTimeoutId);
  detachActivityListeners();
  renderTimer(0);

  const isManualLogout = manual || localStorage.getItem('logout') === 'true';
  if (isManualLogout) {
    localStorage.removeItem('logout');
    window.location.href = 'index.html';
  } else {
    showExpiredUI();
  }
}