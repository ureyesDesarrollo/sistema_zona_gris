/**
 * js/components/toast.js
 * Muestra una notificación toast con iconos y temporizador progresivo.
 */
const TOAST_CONFIGS = {
  success: { title: 'Éxito', class: 'success', icon: 'circle-check' },
  warning: { title: 'Advertencia', class: 'warning', icon: 'octagon-alert' },
  error: { title: 'Error', class: 'danger', icon: 'octagon-alert' },
};

const POSITION_CLASSES = {
  'top-center': 'top-0 start-50 translate-middle-x',
  'top-right': 'top-0 end-0',
  'bottom-right': 'bottom-0 end-0',
  'bottom-center': 'bottom-0 start-50 translate-middle-x'
};

const MAX_TOASTS = 5;
let toastContainer = null;

/**
 * Crea o devuelve el contenedor principal para los toasts.
 * @param {string} position La posición del contenedor.
 * @returns {HTMLElement} El elemento contenedor.
 */
const getOrCreateToastContainer = (position) => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.zIndex = '1200';
    document.body.appendChild(toastContainer);
  }
  toastContainer.className = `position-fixed p-3 ${POSITION_CLASSES[position] || POSITION_CLASSES['top-center']}`;
  return toastContainer;
};

/**
 * Elimina el toast más antiguo si se excede el límite.
 * @param {HTMLElement} container El contenedor de toasts.
 */
const removeOldestToast = (container) => {
  if (container.children.length >= MAX_TOASTS) {
    container.firstChild.remove();
  }
};

/**
 * Muestra una notificación toast con iconos y temporizador progresivo.
 * @param {string} msg Mensaje a mostrar.
 * @param {string} [type='success'] Tipo de notificación (success, warning, error).
 * @param {Object} [options={}] Opciones adicionales.
 * @param {number} [options.duration=5000] Duración en milisegundos.
 * @param {string} [options.position='top-center'] Posición (top-center, etc.).
 * @param {boolean} [options.autohide=true] Ocultar automáticamente.
 */
export const showToast = (msg, type = 'success', options = {}) => {
  const { duration = 5000, position = 'top-center', autohide = true } = options;
  const config = TOAST_CONFIGS[type] || TOAST_CONFIGS.success;

  const container = getOrCreateToastContainer(position);
  removeOldestToast(container);

  const toastEl = document.createElement('div');
  toastEl.className = `toast show mb-3`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  toastEl.innerHTML = `
    <div class="toast-header bg-${config.class} text-white border-0">
      <i data-lucide="${config.icon}" class="me-2"></i>
      <strong class="me-auto">${config.title}</strong>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Cerrar"></button>
    </div>
    <div class="toast-body bg-light">${msg}</div>
    ${autohide ? `<div class="toast-progress bg-${config.class}"></div>` : ''}
  `;

  container.appendChild(toastEl);

  if (autohide) {
    const progressBar = toastEl.querySelector('.toast-progress');
    if (progressBar) {
      progressBar.style.height = '3px';
      progressBar.style.width = '100%';
      // Forzar el "reflow" para que la transición sea visible
      toastEl.offsetWidth;
      progressBar.style.transition = `width ${duration}ms linear`;
      progressBar.style.width = '0%';
    }
  }

  const bsToast = new bootstrap.Toast(toastEl, {
    autohide,
    delay: autohide ? duration : undefined,
  });

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
    if (container.children.length === 0) {
      container.remove();
      toastContainer = null;
    }
  });

  bsToast.show();
};