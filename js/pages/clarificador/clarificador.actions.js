import { showToast } from "../../components/toast.js";
import { fetchEstadoClarificadores, fetchProcesosActivos, iniciarProceso, registrarParametros } from "../../services/clarificador.service.js";
import { alerta } from "../../services/alertas.service.js";
import { handleServiceResponse } from "../../utils/api.js";
import runAction from "../../utils/runActions.js";
import { showClarificadorModal } from "./modals/clarificador.modal.js";
import { showProcessModal } from "./modals/iniciarProceso.modal.js";

export const handleAction = async (action, user) => {
    switch (action) {
        case 'startProcess':
            await startProcess(user);
            break;
        case 'endProcess':
            await endProcess(user);
            break;
        default:
            console.error('Acción no reconocida:', action);
    }
};


const startProcess = async (user) => {
    const procesos = await fetchProcesosActivos();
    const clarificadores = await fetchEstadoClarificadores();
    const result = await showProcessModal(procesos, clarificadores);
    if (result) {
        const { proceso_agrupado_id, clarificador_id } = result;
        const res = await iniciarProceso({ proceso_agrupado_id, clarificador_id });
        handleServiceResponse(res, "No se pudo iniciar el proceso.");
    }
};

const endProcess = async (user) => {
    console.log('Finalizando proceso...');
};

export const ACTIONS = {
    async registrar({ id, btn, reloadFn }) {
            const data = await showClarificadorModal({
                clarificadorId: id,
                title: "Registrar datos",
            });
            if (!data) {
                showToast("Registro cancelado.", "warning");
                return;
            }
        await runAction(btn, reloadFn, async () => {
            const res = await registrarParametros(data);
            if(data.payloadAlerta != {}){
                alerta(data.payloadAlerta);
            }
            handleServiceResponse(res, "No se pudo guardar el registro.");
            showToast("Registro guardado correctamente.", "success");
        });
    }
}
