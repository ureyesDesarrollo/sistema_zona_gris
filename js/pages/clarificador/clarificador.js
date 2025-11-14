import { isAdminOrGerente } from "../../utils/session.js";
import { handleAction } from "./clarificador.actions.js";
import { updateUI } from "./clarificador.ui.js";
import { getUser } from '../../utils/auth.js';
import { refreshSession, renderTimer, SESSION_DURATION_MS, isExpired } from '../../components/sessionTimer.js';
import { showProcessModal } from "./modals/iniciarProceso.modal.js";

export async function init() {
    let refreshTimer = null;
    const user = getUser();
    const userIsAdminOrGerente = isAdminOrGerente(user);
    const btnIniciarProceso = document.getElementById('btn-iniciar-proceso-clarificador');
    const btnFinalizarProceso = document.getElementById('btn-finalizar-proceso-clarificador');
    const btnPreparacionPolimero = document.getElementById('btn-preparacion-polimero');
    const btnRegistroPolimero = document.getElementById('btn-registro-polimero');
    await updateUI(user);

    if (btnIniciarProceso) {
        btnIniciarProceso.addEventListener('click', () => handleAction('startProcess', user));
    }

    if (btnFinalizarProceso) {
        btnFinalizarProceso.addEventListener('click', () => handleAction('endProcess', user));
    }

    if (btnPreparacionPolimero) {
        btnPreparacionPolimero.addEventListener('click', () => handleAction('preparacionPolimero', user));
    }


    if (btnRegistroPolimero) {
        btnRegistroPolimero.addEventListener('click', () => handleAction('registroPolimero', user));
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