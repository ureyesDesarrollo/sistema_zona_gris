import { showToast } from "../../components/toast.js";
import { fetchEstadoClarificadores, fetchProcesosActivos, iniciarProceso, insertarQuimico, insertarQuimicoClarificador, obtenerLoteQuimico, registrarParametros, validacionHora } from "../../services/clarificador.service.js";
import { alerta } from "../../services/alertas.service.js";
import { handleServiceResponse } from "../../utils/api.js";
import runAction from "../../utils/runActions.js";
import { showClarificadorModal } from "./modals/clarificador.modal.js";
import { showProcessModal } from "./modals/iniciarProceso.modal.js";
import { showClarificadorValidateModal } from "./modals/validate.modal.js";
import { updateUI } from "./clarificador.ui.js";
import { showPreparacionPolimeroModal } from "./modals/preparacionPolimero.js";
import { showRegistroPolimeroModal } from "./modals/registroPolimero.js";

export const handleAction = async (action, user) => {
    switch (action) {
        case 'startProcess':
            await startProcess(user);
            break;
        case 'endProcess':
            await endProcess(user);
            break;
        case 'preparacionPolimero':
            await preparacionPolimero();
            break;
        case 'registroPolimero':
            await registroPolimero();
            break;
        default:
            console.error('Acción no reconocida:', action);
    }
};


const startProcess = async (user) => {
    const procesos = await fetchProcesosActivos();
    const clarificadores = await fetchEstadoClarificadores();
    const result = await showProcessModal(procesos, clarificadores);
    try {
        if (result) {
            const { proceso_agrupado_id, clarificador_id } = result;
            const res = await iniciarProceso({ proceso_agrupado_id, clarificador_id });
            handleServiceResponse(res, "No se pudo iniciar el proceso.");
            updateUI(user);
            showToast("Proceso iniciado correctamente.", "success");
        }
    } catch (error) {
        console.error("Error en inicio de proceso:", error);
        showToast(error.message, "error");
    }
};

const endProcess = async (user) => {
    console.log('Finalizando proceso...');
};

const preparacionPolimero = async () => {
    try {
        const result = await showPreparacionPolimeroModal();
        console.log(result);

        if (result) {
            const { LOTE, NOMBRE } = result;
            const res = await insertarQuimico({ lote: LOTE , nombre_quimico: NOMBRE });
            handleServiceResponse(res, "No se pudo insertar el químico.");
            showToast(`Químico insertado correctamente: ${LOTE}`, "success");
        }
    } catch (error) {
        console.error("Error en preparación de polímero:", error);
        showToast(error.message, "error");
    }
};

const registroPolimero = async () => {
    try {
        const result = await showRegistroPolimeroModal();
        console.log(result);

        if (result) {
            const res = await insertarQuimicoClarificador(result);
            handleServiceResponse(res, "No se pudo insertar el químico.");
            showToast(`Químico insertado correctamente: ${result.lotes}`, "success");
        }
    } catch (error) {
        console.error("Error en registro de polímero:", error);
        showToast(error.message, "error");
    }
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
            if (data.payloadAlerta != {}) {
                alerta(data.payloadAlerta);
            }
            handleServiceResponse(res, "No se pudo guardar el registro.");
            showToast("Registro guardado correctamente.", "success");
        });
    },

    async validar({ id, btn, reloadFn }) {
        const data = await showClarificadorValidateModal({
            clarificadorId: id,
            title: "Validar datos",
        });
        if (!data) {
            showToast("Validación cancelada.", "warning");
            return;
        }


        await runAction(btn, reloadFn, async () => {
            const res = await validacionHora(data);
            handleServiceResponse(res, "No se pudo validar el registro.");
            showToast("Registro validado correctamente.", "success");
        });
    }
}
