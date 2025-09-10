// components/cocedores/cardsStatus.js

/**
 * Mapeo de configuraciones para cada tipo de tarjeta de estado.
 */
const CARD_CONFIGS = {
  active: {
    id: 'cocedoresCardCountActive',
    text: 'Cocedores activos',
    icon: 'flame',
    color: 'success',
    delay: '0.1s',
    filter: (cocedor) => cocedor.estatus === 'ACTIVO'
  },
  alerts: {
    id: 'cocedoresCardCountAlerts',
    text: 'Cocedores sin verificar por supervisor',
    icon: 'triangle-alert',
    color: 'warning',
    delay: '0.3s',
    filter: (cocedor) => cocedor.supervisor_validado === '0'
  },
  maintenance: {
    id: 'cocedoresCardCountMaintenance',
    text: 'Mantenimiento',
    icon: 'wrench',
    color: 'danger',
    delay: '0.4s',
    filter: (cocedor) => cocedor.estatus === 'MANTENIMIENTO'
  }
};

/**
 * Genera el HTML de una tarjeta de estado individual.
 * @param {Object} config - Objeto de configuración de la tarjeta.
 * @returns {string} El marcado HTML de la tarjeta.
 */
const getCardMarkup = (config) => {
  return `
    <div class="col">
      <div class="card h-100 fade-in" style="animation-delay: ${config.delay}">
        <div class="card-body text-center">
          <div class="mb-3">
            <div class="bg-${config.color} bg-opacity-10 text-${config.color} rounded-circle d-inline-flex align-items-center justify-content-center" style="width:60px;height:60px">
              <i data-lucide="${config.icon}" style="width:40px; height:40px;"></i>
            </div>
          </div>
          <h3 class="mb-1" id="${config.id}">...</h3>
          <p class="text-muted mb-0">${config.text}</p>
        </div>
      </div>
    </div>
  `;
};

/**
 * Genera todo el marcado HTML para las tarjetas de estado.
 * @returns {string} El marcado HTML de todas las tarjetas.
 */
const getCardsMarkup = () => {
  return Object.values(CARD_CONFIGS).map(getCardMarkup).join('');
};

/**
 * Renderiza las tarjetas de estado de los cocedores.
 * @param {Object} params - Objeto que contiene user y cocedores.
 * @param {Object} params.user - Objeto del usuario.
 * @param {Array<Object>} params.cocedores - Array de objetos de cocedores.
 */
export function renderCardsStatus({ user, cocedores }) {
  const container = document.getElementById('status-cards');
  if (!container) {
    console.warn('renderCardsStatus: no existe #status-cards en el DOM');
    return;
  }

  // 1. Visibilidad y renderizado
  const isAdmin = user?.perfil === 'Admin' || user?.perfil === 'Gerente zona gris';
  container.innerHTML = getCardsMarkup();
  container.classList.toggle('d-none', !isAdmin);

  if (!isAdmin) {
    return; // Detiene la ejecución si el usuario no es admin
  }

  // 2. Actualización de contadores
  // Cuentas solo si el usuario es Admin
  const counts = {
    active: 0,
    alerts: 0,
    maintenance: 0,
  };
  
  if (Array.isArray(cocedores)) {
    cocedores.forEach(cocedor => {
      if (CARD_CONFIGS.active.filter(cocedor)) {
        counts.active++;
      }
      if (CARD_CONFIGS.alerts.filter(cocedor)) {
        counts.alerts++;
      }
      if (CARD_CONFIGS.maintenance.filter(cocedor)) {
        counts.maintenance++;
      }
    });
  }

  // 3. Inyección de los valores
  const countActiveEl = container.querySelector(`#${CARD_CONFIGS.active.id}`);
  const countAlertsEl = container.querySelector(`#${CARD_CONFIGS.alerts.id}`);
  const countMaintenanceEl = container.querySelector(`#${CARD_CONFIGS.maintenance.id}`);
  
  if (countActiveEl) countActiveEl.textContent = counts.active;
  if (countAlertsEl) countAlertsEl.textContent = counts.alerts;
  if (countMaintenanceEl) countMaintenanceEl.textContent = counts.maintenance;
}