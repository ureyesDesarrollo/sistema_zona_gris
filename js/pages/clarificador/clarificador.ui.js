import { isSupervisor, isControlProcesos } from '../../utils/session.js';
import { renderTableClarificadores, setupStatusChangeListeners } from './tablaClarificadores.js';
import { fetchEstadoClarificadores } from '../../services/clarificador.service.js';

const getElements = () => {
    return {
        btnIniciarProcesoClarificador: document.getElementById('btn-iniciar-proceso-clarificador'),
        btnFinalizarProcesoClarificador: document.getElementById('btn-finalizar-proceso-clarificador'),
        btnPreparacionPolimero: document.getElementById('btn-preparacion-polimero'),
        accionesColumn: document.getElementById('acciones-column'),
        tablaBody: document.getElementById('tabla-clarificadores'),
    }
}

export async function updateUI(user) {
    const { btnIniciarProcesoClarificador, btnFinalizarProcesoClarificador, accionesColumn, tablaBody, btnPreparacionPolimero } = getElements();
    const userIsSupervisor = isSupervisor(user);
    const userIsControlProcesos = isControlProcesos(user);
    const clarificadores = await fetchEstadoClarificadores();

    if (btnIniciarProcesoClarificador) {
        btnIniciarProcesoClarificador.classList.toggle('d-none', !userIsSupervisor);
    }

    if (btnFinalizarProcesoClarificador) {
        btnFinalizarProcesoClarificador.classList.toggle('d-none', !userIsSupervisor);
    }

    if(btnPreparacionPolimero){
        btnPreparacionPolimero.classList.toggle('d-none', !userIsSupervisor);
    }

    if (accionesColumn) {
        accionesColumn.classList.toggle('d-none', false);
    }

    if (tablaBody) {
        renderTableClarificadores(clarificadores, tablaBody);
        setupStatusChangeListeners(tablaBody, () => updateUI(user));
    }
}