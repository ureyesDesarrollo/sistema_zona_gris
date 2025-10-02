// js/components/cocedores/tablaCocedores.js

import { showToast } from "../toast.js";
import { isAdminOrGerente, tienePermiso } from "../../utils/session.js";
import { ACTIONS } from "../../pages/cocedores/cocedores.actions.js";
import { reduceMateriales ,renderMateriales, procesarMateriales } from "../../utils/renderMateriales.js";
import { renderBadgeEstatus } from "../../utils/statusBadges.js";
import { renderButton } from "../../utils/renderButtons.js";


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
        const materialesAgrupado = reduceMateriales(materiales);
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