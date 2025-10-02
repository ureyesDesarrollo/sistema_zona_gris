/**
 * Renderiza el HTML de una insignia de estado.
 * @param {string} estatus - El estado del cocedor.
 * @returns {string} El HTML del badge.
 */
export const renderBadgeEstatus = (estatus) => {
    const statusConfig = {
        'ACTIVO': { class: 'status-active', icon: 'zap', tooltip: 'Operativo' },
        'MANTENIMIENTO': { class: 'status-maintenance', icon: 'wrench', tooltip: 'En mantenimiento' },
        'INACTIVO': { class: 'status-inactive', icon: 'power-off', tooltip: 'Apagado' },
        'PENDIENTE': { class: 'status-pending', icon: 'clock', tooltip: 'Esperando acción' }
    };
    const config = statusConfig[estatus] || statusConfig.PENDIENTE;

    return `
        <span class="status-badge ${config.class}" 
              title="${config.tooltip}" 
              aria-label="${config.tooltip}">
            <i data-lucide="${config.icon}"></i>
            ${estatus}
        </span>
    `;
};