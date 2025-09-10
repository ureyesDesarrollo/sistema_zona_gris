// js/pages/cocedores.tableActions.js

import { showConfirm } from '../../components/modals/modal.confirm.js';
import { showToast } from '../../components/toast.js';
import { fetchProcesos, fetchCocedores, iniciarProcesos, obtenerMezclaEnProceso, obtenerMezclaById, finalizarMezcla } from '../../services/cocedores.service.js';
import { updateUI } from './cocedores.ui.js';
import { showProcessModal } from './modals/iniciarProceso.modal.js';

export const handleAction = async (actionType, user) => {
    switch (actionType) {
        case 'startProcess':
            await handleStartProcess(user);
            break;
        case 'endProcess':
            await handleEndProcess();
            break;
    }
};

const handleStartProcess = async (user) => {
    const { user_id } = user;
    const procesos = await fetchProcesos();
    const cocedoresList = await fetchCocedores();
    const cocedoresActivos = cocedoresList.filter(c => c.estatus === 'ACTIVO');

    const seleccion = await showProcessModal(procesos, cocedoresActivos, {
        allowMultiple: true,
        minSelection: 1,
        title: 'Selecciona procesos y cocedores'
    });

    if (!seleccion) return;

    const { procesos: selectedProcesos, cocedores: selectedCocedores } = seleccion;
    const confirmacion = await showConfirm('¿Desea iniciar los procesos seleccionados?');

    if (!confirmacion) return;

    const payload = {
        procesos: selectedProcesos,
        cocedores: selectedCocedores,
        descripcion: `Procesos: ${selectedProcesos.join(', ')}`,
        usuario_id: user_id
    };
    const respuesta = await iniciarProcesos(payload);

    if (respuesta.success) {
        showToast('Procesos iniciados correctamente', 'success');
        updateUI(user);
    } else {
        const message = respuesta.error;
        showToast(message, 'error');
    }
};

const handleEndProcess = async (user) => {
    const { data :procesosEnCurso } = await obtenerMezclaEnProceso();
    
    if (!procesosEnCurso || procesosEnCurso.length === 0) {
        showToast('Sin procesos en proceso', 'warning');
        return;
    }

    const unvalidated = procesosEnCurso.some(p => Number(p.supervisor_validado) === 0);
    if (unvalidated) {
        showToast('No se puede finalizar el proceso, ya que no se ha validado por supervisor', 'warning');
        return;
    }

    const id = procesosEnCurso[0].proceso_agrupado_id;
    const {data: mezcla} = await obtenerMezclaById(id);
    const pro = mezcla.map(m => m.pro_id).join('/');

    const confirmacion = await showConfirm(`¿Desea finalizar el proceso ${pro}?`);
    if (!confirmacion) return;

    const payload = { proceso_agrupado_id: id };
    const respuesta = await finalizarMezcla(payload);

    if (respuesta.success) {
        showToast('Proceso finalizado correctamente', 'success');
        updateUI(user);
    } else {
        showToast(respuesta.error, 'error');
    }
};