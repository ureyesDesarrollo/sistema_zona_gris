// js/pages/cocedores.ui.js
import { renderCardsStatus } from '../../components/cocedores/cardsStatus.js';
import { renderTableCocedores, setupStatusChangeListeners } from '../../components/cocedores/tablaCocedores.js';
import { fetchCocedores, fetchProximaRevision } from '../../services/cocedores.service.js';
import { isSupervisor, isControlProcesos } from '../../utils/session.js';

const getElements = () => {
    return {
        proximaRevisionEl: document.getElementById('hora-proximo-registro'),
        tablaBody: document.getElementById('tabla-cocedores'),
        accionesColumn: document.getElementById('acciones-column'),
        btnIniciarProceso: document.getElementById('btn-iniciar-proceso'),
        btnFinalizarProceso: document.getElementById('btn-finalizar-proceso'),
    };
};

export async function updateUI(user) {
    const elements = getElements();
    const cocedores = await fetchCocedores();
    const data = await fetchProximaRevision();
    const userIsSupervisor = isSupervisor(user);
    const userIsControlProcesos = isControlProcesos(user);

    if (elements.accionesColumn) {
        elements.accionesColumn.classList.toggle('d-none', !(userIsSupervisor || userIsControlProcesos));
    }
    if (elements.btnIniciarProceso) {
        elements.btnIniciarProceso.classList.toggle('d-none', !userIsSupervisor);
    }
    if (elements.btnFinalizarProceso) {
        elements.btnFinalizarProceso.classList.toggle('d-none', !userIsSupervisor);
    }
    if (elements.proximaRevisionEl) {
        elements.proximaRevisionEl.textContent = data ?? '--:--';
    }

    renderCardsStatus({ user, cocedores });

    if (elements.tablaBody) {
        renderTableCocedores(cocedores, elements.tablaBody);
        setupStatusChangeListeners(
            elements.tablaBody,
            () => updateUI(user) // Pasamos la función completa para un refresco general de la UI.
        );
    }
}