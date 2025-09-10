// js/components/cocedores/tablaCocedores.js

import { showToast } from "../toast.js";
import { isAdminOrGerente, tienePermiso } from "../../utils/session.js";
import { ACTIONS } from "../../pages/cocedores/cocedores.actions.js";
import { procesarMateriales, renderMateriales } from "../../pages/cocedores/modals/iniciarProceso.modal.js";

/**
 * Agrupa y suma las cantidades de materiales con el mismo nombre.
 * @param {Array<Object>} materiales - Lista de materiales sin procesar.
 * @returns {Array<Object>} Un array con los materiales agrupados.
 */
const reduceMateriles = (materiales) => {
    return Object.values(materiales.reduce((acc, item) => {
        const nombre = item.nombre.trim();
        const cantidadNum = parseFloat(item.cantidad);

        if (!acc[nombre]) {
            acc[nombre] = { nombre, cantidad: 0 };
        }
        acc[nombre].cantidad += cantidadNum;
        return acc;
    }, {}));
};

/**
 * Renderiza el HTML de una insignia de estado.
 * @param {string} estatus - El estado del cocedor.
 * @returns {string} El HTML del badge.
 */
const renderBadgeEstatus = (estatus) => {
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

/**
 * Genera el HTML para un botón de acción.
 * @param {string} className - Clase CSS del botón.
 * @param {string} title - Título del botón.
 * @param {string} iconName - Nombre del ícono de Lucide.
 * @param {string} btnText - Texto del botón.
 * @param {string} [dataId] - ID para el atributo data-id.
 * @param {boolean} [disabled=false] - Indica si el botón debe estar deshabilitado.
 * @returns {string} El HTML del botón.
 */
const renderButton = (className, title, iconName, btnText, dataId, disabled = false) => {
    const disabledAttr = disabled ? 'disabled' : '';
    const dataAttr = dataId ? `data-id="${dataId}"` : '';
    const classAttr = className.startsWith('btn-registrar-disabled') ? className : `${className} pulse-hover`;
    
    return `
        <button class="btn btn-action ${classAttr}"
                title="${title}"
                aria-label="${title}"
                ${dataAttr}
                ${disabledAttr}>
            <i data-lucide="${iconName}"></i>
            <span class="btn-text">${btnText}</span>
        </button>
    `;
};


/**
 * Renderiza las acciones para el rol de Supervisor.
 * @param {string} cocedorId - ID del cocedor.
 * @param {string} estatus - Estado del cocedor.
 * @returns {string} El HTML de la celda de acciones.
 */
const renderActionsSupervisor = (cocedorId, estatus) => {
    let statusButtonHtml = '';
    if (estatus === 'ACTIVO') {
        statusButtonHtml = renderButton('btn-pause', 'Pausar servicio', 'pause-circle', 'Pausar', cocedorId);
    } else if (estatus === 'MANTENIMIENTO') {
        statusButtonHtml = renderButton('btn-activate', 'Activar servicio', 'play-circle', 'Activar', cocedorId);
    }

    return `
        <td class="actions-cell">
            <div class="btn-group btn-group-actions" role="group">
                ${renderButton('btn-validar', 'Validar registro', 'notebook-tabs', 'Validar', cocedorId)}
                ${statusButtonHtml}
            </div>
        </td>
    `;
};

/**
 * Renderiza las acciones para el rol de Control de Procesos.
 * @param {string} cocedorId - ID del cocedor.
 * @param {string} estatus - Estado del cocedor.
 * @param {boolean} supervisorValidado - Estado de validación por supervisor.
 * @returns {string} El HTML de la celda de acciones.
 */
const renderActionsControlProcesos = (cocedorId, estatus, supervisorValidado) => {
    let buttonHtml = '';
    if (estatus === 'ACTIVO' && supervisorValidado) {
        buttonHtml = renderButton('btn-registrar', 'Registrar parámetros', 'test-tube', 'Registrar', cocedorId);
    } else if (estatus === 'ACTIVO' && !supervisorValidado) {
        buttonHtml = renderButton('btn-registrar-disabled', 'No validado por supervisor', 'test-tube', 'Registrar');
    } else { // estatus === 'MANTENIMIENTO' || 'INACTIVO'
        buttonHtml = renderButton('btn-registrar-disabled', 'En mantenimiento', 'test-tube', 'Registrar');
    }

    return `
        <td class="actions-cell">
            <div class="btn-group btn-group-actions" role="group">
                ${buttonHtml}
            </div>
        </td>
    `;
};

/**
 * Renderiza la celda de acciones según los permisos del usuario.
 * @param {Object} c - Objeto del cocedor.
 * @param {Object} user - Objeto del usuario.
 * @returns {string} El HTML de la celda de acciones o una cadena vacía.
 */
const renderAccionesCocedor = (c, user,validado) => {
    if (isAdminOrGerente(user)) return '';
    return tienePermiso('Cocedores', 'editar')
        ? renderActionsSupervisor(c.cocedor_id, c.estatus)
        : renderActionsControlProcesos(c.cocedor_id, c.estatus, validado);
};

// --- Exportaciones ---

/**
 * Renderiza el cuerpo de la tabla de cocedores.
 * @param {Array<Object>} cocedores - Lista de objetos cocedor.
 * @param {HTMLElement} tablaBody - El elemento <tbody> de la tabla.
 */
export const renderTableCocedores = (cocedores, tablaBody) => {
    const user = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (!Array.isArray(cocedores) || cocedores.length === 0) {
        tablaBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">Sin cocedores registrados</td></tr>`;
        return;
    }

    const rowsHtml = cocedores.map((c, i) => {
        const materiales = procesarMateriales(c.materiales);
        const materialesAgrupado = reduceMateriles(materiales);
        const isValidated = Number(c.supervisor_validado) === 1 || c.supervisor_validado === null;

        return `
            <tr class="data-row ${isValidated ? '' : 'tr-no-validado'}">
                <td class="cell-id">#${(c.cocedor_id || i + 1).toString().padStart(3, '0')}</td>
                <td class="cell-name">${c.nombre || '-'}</td>
                <td class="cell-name">${c.procesos || '-'}</td>
                <td class="cell-name">
                    <div class="d-flex flex-wrap gap-1">
                        ${renderMateriales(materialesAgrupado, 5, false)}
                    </div>
                </td>
                <td class="cell-status">${renderBadgeEstatus(c.estatus)}</td>
                <td class="cell-temperature ${c.temperatura_entrada > 100 ? 'warning' : ''}">
                    ${c.temperatura_entrada ? `${c.temperatura_entrada}°C` : '-'}
                </td>
                <td class="cell-temperature ${c.temperatura_salida > 100 ? 'warning' : ''}">
                    ${c.temperatura_salida ? `${c.temperatura_salida}°C` : '-'}
                </td>
                <td class="cell-activity">${c.responsable_tipo || '-'}</td>
                <td class="cell-activity">${c.fecha_registro || '-'}</td>
                ${renderAccionesCocedor(c, user, isValidated)}
            </tr>
        `;
    }).join('');

    tablaBody.innerHTML = rowsHtml;
};

/**
 * Configura los "event listeners" para los botones de la tabla.
 * @param {HTMLElement} tablaBody - El elemento <tbody> de la tabla.
 * @param {Function} reloadFn - Función para recargar los datos de la tabla.
 */
export const setupStatusChangeListeners = (tablaBody, reloadFn) => {
    if (!tablaBody || tablaBody.__listenersBound) return;
    tablaBody.__listenersBound = true;

    tablaBody.addEventListener("click", async (e) => {
        const btn = e.target.closest?.("[data-id]");
        if (!btn || btn.disabled) return;

        // Mapeo directo de clases a acciones
        const actionMap = {
            'btn-validar': 'validar',
            'btn-pause': 'pause',
            'btn-activate': 'activate',
            'btn-registrar': 'registrar'
        };

        const action = Object.keys(actionMap).find(key => btn.classList.contains(key));
        if (!action) return;

        const id = btn.dataset.id;
        if (!id) {
            showToast("ID no definido.", false);
            return;
        }

        await ACTIONS[actionMap[action]]({ id, btn, reloadFn });
    }, { passive: true });
};