/**
 * Muestra una notificación toast con iconos y temporizador progresivo
 * @param {string} msg - Mensaje a mostrar
 * @param {boolean} [ok=true] - Tipo de notificación (éxito/error)
 * @param {Object} [options={}] - Opciones adicionales
 * @param {number} [options.duration=5000] - Duración en milisegundos
 * @param {string} [options.position='top-center'] - Posición (top-center, bottom-right, etc.)
 * @param {boolean} [options.autohide=true] - Ocultar automáticamente
 * @param {string} [options.type='success'] - Tipo de notificación (success, warning, error)
 */

export const showToast = (msg, ok = true, options = {}) => {
    const {
      duration = 5000,
      position = 'top-center',
      autohide = true,
      type = 'success',
    } = options;

    console.log(type);
    const types = {
      success: {
        class: 'success',
        icon: 'circle-check',
      },
      warning: {
        class: 'warning',
        icon: 'octagon-alert',
      },
      error: {
        class: 'danger',
        icon: 'octagon-alert',
      },
    };

    if (!types[type]) {
      console.warn(`Tipo de toast no válido: ${type}. Usando 'success' por defecto.`);
      type = 'success';
    }
  
    const toastId = 'toast-' + Date.now();
    const typeClass = types[type]?.class || 'success';
    const toastIcon = types[type]?.icon || 'circle-check';
  
    // Mapear posiciones a clases de Bootstrap
    const positionClasses = {
      'top-center': 'top-0 start-50 translate-middle-x',
      'top-right': 'top-0 end-0',
      'bottom-right': 'bottom-0 end-0',
      'bottom-center': 'bottom-0 start-50 translate-middle-x'
    };
  
    const positionClass = positionClasses[position] || positionClasses['top-center'];
  
    // Crear contenedor de toast si no existe
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'position-fixed p-3';
      toastContainer.style.zIndex = '1200';
      document.body.appendChild(toastContainer);
    }
  
    // Crear elemento toast
    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = `toast show mb-3`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.innerHTML = `
      <div class="toast-header bg-${typeClass} text-white border-0">
        <i data-lucide="${toastIcon}" class="me-2"></i>
        <strong class="me-auto">${ok ? 'Éxito' : 'Error'}</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Cerrar"></button>
      </div>
      <div class="toast-body bg-light">
        ${msg}
      </div>
      ${autohide ? `<div class="toast-progress bg-${typeClass}"></div>` : ''}
    `;
  
    // Estilos dinámicos para la posición
    toastContainer.className = `position-fixed p-3 ${positionClass}`;
    toastContainer.appendChild(toastEl);
  
    // Barra de progreso para autohide
    if (autohide) {
      const progressBar = toastEl.querySelector('.toast-progress');
      progressBar.style.height = '3px';
      progressBar.style.width = '100%';
      progressBar.style.transition = `width ${duration}ms linear`;
      setTimeout(() => {
        progressBar.style.width = '0';
      }, 10);
    }
  
    // Configurar toast de Bootstrap
    const bsToast = new bootstrap.Toast(toastEl, {
      autohide,
      delay: autohide ? duration : undefined
    });
  
    // Eliminar el toast del DOM cuando se oculta
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
      // Eliminar contenedor si no hay más toasts
      if (toastContainer.children.length === 0) {
        toastContainer.remove();
      }
    });
  
    bsToast.show();
  }