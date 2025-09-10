// js/pages/cocedores.js
import { handleAction } from './cocedores.tableActions.js'; // Nuevo archivo para las acciones
import { updateUI } from './cocedores.ui.js';       // Nuevo archivo para la lógica de UI
import { getUser } from '../../utils/auth.js';
import { isAdminOrGerente } from '../../utils/session.js';
import { refreshSession, renderTimer, SESSION_DURATION_MS, isExpired } from '../../components/sessionTimer.js';

let refreshTimer = null;

export async function init() {
    const user = getUser();
    const userIsAdminOrGerente = isAdminOrGerente(user);

    await updateUI(user);

    const btnIniciarProceso = document.getElementById('btn-iniciar-proceso');
    const btnFinalizarProceso = document.getElementById('btn-finalizar-proceso');

    if (btnIniciarProceso) {
        btnIniciarProceso.addEventListener('click', () => handleAction('startProcess', user));
    }
    if (btnFinalizarProceso) {
        btnFinalizarProceso.addEventListener('click', () => handleAction('endProcess', user));
    }

    if (userIsAdminOrGerente) {
        refreshTimer = setInterval(async () => {
            if (!isExpired) {
                await updateUI(user);
                refreshSession();
                renderTimer(SESSION_DURATION_MS);
            }
        }, 5 * 60 * 1000);
    }
}

export function destroy() {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
}