import { getUser } from "../../utils/auth.js";
import { reduceMateriales, renderMateriales, procesarMateriales } from "../../utils/renderMateriales.js";
import { renderBadgeEstatus } from "../../utils/statusBadges.js";
import { renderButton } from "../../utils/renderButtons.js";
import { isAdminOrGerente } from "../../utils/session.js";
import { ACTIONS } from "./clarificador.actions.js";
export const renderTableClarificadores = (clarificadores, tableBody) => {
    const user = getUser();

    if (!Array.isArray(clarificadores) || clarificadores.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No hay clarificadores</td></tr>';
        return;
    }

    const rowsHtml = clarificadores.map((c, i) => {
        const materiales = procesarMateriales(c.materiales);
        const materialesAgrupado = reduceMateriales(materiales);

        return `
        <tr class="data-row">
            <td class="cell-id">#${(c.clarificador_id || i + 1).toString().padStart(3, '0')}</td>
            <td class="cell-name">${c.nombre || '-'}</td>
            <td class="cell-name">${c.procesos || '-'}</td>
            <td class="cell-name">
                <div class="d-flex flex-wrap gap-1">
                    ${renderMateriales(materialesAgrupado, 5, false)}
                </div>
            </td>
            <td class="cell-status">${renderBadgeEstatus(c.estatus)}</td>
            ${renderAccionesClarificador(c, user, c.validado)}
        </tr>
        `;
    });

    tableBody.innerHTML = rowsHtml.join('');
}

/**
 * Renderiza la celda de acciones según los permisos del usuario.
 * @param {Object} c - Objeto del cocedor.
 * @param {Object} user - Objeto del usuario.
 * @returns {string} El HTML de la celda de acciones o una cadena vacía.
 */
const renderAccionesClarificador = (c, user, validado) => {
    if (isAdminOrGerente(user)) return '';
    /*  return tienePermiso('Cocedores', 'editar')
         ? renderActionsSupervisor(c.cocedor_id, c.estatus)
         : renderActionsControlProcesos(c.cocedor_id, c.estatus, validado);
         */ 
         return `<td class="actions-cell">
                 <div class="btn-group btn-group-actions" role="group">
                     ${renderButton('btn-validar', 'Validar', 'notebook-tabs', 'Validar', c.clarificador_id)}
                     ${renderButton('btn-registrar', 'Registrar', 'test-tube', 'Registrar', c.clarificador_id)}
                 </div>
             </td>`;
};

export const setupStatusChangeListeners = (tablaBody, reloadFn) => {
    if (!tablaBody || tablaBody.__listenersBound) return;
    tablaBody.__listenersBound = true;

    tablaBody.addEventListener("click", async (e) => {
        const btn = e.target.closest?.("[data-id]");
        if (!btn || btn.disabled) return;

        // Mapeo directo de clases a acciones
        const actionMap = {
            'btn-validar': 'validar',
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