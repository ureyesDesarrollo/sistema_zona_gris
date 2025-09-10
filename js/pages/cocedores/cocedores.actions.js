import {
    changeStatus,
    registrarParo,
    finalizarParo,
    validarConsecutividadHoraXHora, // Renombrado para corregir el error tipográfico
    registrarHoraXHora,
    validarHoraXHora,
    alerta,
} from "../../services/cocedores.service.js";
import { getUserId } from "../../utils/session.js";
import { showToast } from "../../components/toast.js";
import { showMaintenanceModal } from "./modals/maintenance.modal.js";
import { showConfirm } from "../../components/modals/modal.confirm.js";
import { showCocedorCaptureModal } from "./modals/cocedor.modal.js";
import { showCocedorValidateModal } from "./modals/validate.modal.js";

/**
 * Procesa la respuesta de la API y lanza un error con un mensaje descriptivo si falla.
 * Esto evita la duplicación de código en cada función de acción.
 * @param {object} res La respuesta de la API.
 * @param {string} defaultMsg Mensaje de error por defecto.
 */
export const handleServiceResponse = (res, defaultMsg = "Ocurrió un error") => {
    const isArray = Array.isArray(res);
    const isObject = typeof res === 'object' && res !== null && !isArray;

    // Casos válidos: array, o objeto con ok/success/data positivo
    const isSuccess =
        isArray ||
        (isObject && (
            res.ok === true ||
            res.success === true ||
            (res.data !== undefined && res.data !== null)
        ));

    if (isSuccess) return;

    console.error("❌ Error en respuesta del servicio:", res);

    let errorMsg = defaultMsg;

    if (isObject) {
        // Errores tipo objeto
        if (res.errors) {
            if (typeof res.errors === 'object') {
                errorMsg = Object.entries(res.errors)
                    .map(([field, msgs]) => `• ${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
                    .join("<br>");
            } else if (typeof res.errors === 'string') {
                errorMsg = res.errors;
            }
        }

        // Error simple
        else if (res.error) {
            errorMsg = res.error;
        }

        // Mensaje genérico
        else if (res.message) {
            errorMsg = res.message;
        }
    }

    throw new Error(errorMsg);
};


/**
 * Ejecuta una acción de forma segura, previniendo múltiples clics.
 * Se encarga de la deshabilitación del botón y el manejo de errores global.
 * @param {HTMLElement} btn El botón que activa la acción.
 * @param {function} reloadFn La función para recargar la UI.
 * @param {function} actionFn La función asíncrona que realiza la lógica de la acción.
 */
const runAction = async (btn, reloadFn, actionFn) => {
    // Previene múltiples clics mientras la acción está en curso.
    if (btn.hasAttribute("data-in-flight")) return;

    btn.setAttribute("data-in-flight", "1");
    btn.disabled = true;

    try {
        await actionFn();
        // Recarga la UI solo si la acción fue exitosa.
        if (typeof reloadFn === "function") {
            await reloadFn();
        }
    } catch (error) {
        console.error("Error en la acción:", error);
        // Muestra un toast de error con el mensaje capturado.
        showToast(error.message || "Ocurrió un error inesperado.", "error");
    } finally {
        // Restaura el estado del botón.
        btn.disabled = false;
        btn.removeAttribute("data-in-flight");
    }
};

export const ACTIONS = {
    // Pone un cocedor en estado de mantenimiento.
    async pause({ id, btn, reloadFn }) {
        const ok = await showConfirm("¿Está seguro de poner este cocedor en mantenimiento?");
        if (!ok) return;

        const motivo = await showMaintenanceModal({
            title: "Motivo del paro",
            label: "Motivo",
            placeholder: "Escribe el motivo aquí...",
            okText: "Aceptar",
            cancelText: "Cancelar",
            minLength: 3,
            maxLength: 500,
        });
        if (!motivo) {
            showToast("Operación cancelada: motivo no proporcionado.", "warning");
            return;
        }

        const usuario_id = getUserId();
        if (!usuario_id) {
            showToast("No se pudo identificar al usuario.", "error");
            return;
        }

        await runAction(btn, reloadFn, async () => {
            // Usa handleServiceResponse para gestionar la respuesta de la API.
            const paroRes = await registrarParo({ cocedor_id: id, motivo, usuario_id });
            handleServiceResponse(paroRes, "No se pudo registrar el paro.");

            const statusRes = await changeStatus(id, "MANTENIMIENTO");
            handleServiceResponse(statusRes, "No se pudo cambiar el estatus.");

            showToast("Cocedor puesto en mantenimiento.", "success");
        });
    },

    // Activa un cocedor que estaba en mantenimiento.
    async activate({ id, btn, reloadFn }) {
        const ok = await showConfirm("¿Desea activar este cocedor?");
        if (!ok) return;

        const observaciones = await showMaintenanceModal({
            title: "Observaciones para activar",
            label: "Observaciones",
            placeholder: "Describa observaciones de la activación...",
            okText: "Aceptar",
            cancelText: "Cancelar",
            minLength: 3,
            maxLength: 500,
        });
        if (!observaciones) {
            showToast("Activación cancelada: observaciones no proporcionadas.", "warning");
            return;
        }

        const usuario_id = getUserId();
        if (!usuario_id) {
            showToast("No se pudo identificar al usuario.", "error");
            return;
        }

        await runAction(btn, reloadFn, async () => {
            const finRes = await finalizarParo({ cocedor_id: id, observaciones, usuario_id });
            handleServiceResponse(finRes, "No se pudo finalizar el paro.");

            const statusRes = await changeStatus(id, "ACTIVO");
            handleServiceResponse(statusRes, "No se pudo cambiar el estatus.");

            showToast("Cocedor activado.", "success");
        });
    },

    // Registra un dato de hora por hora para un cocedor.
    async registrar({ id, btn, reloadFn }) {
        const usuario_id = getUserId();
        if (!usuario_id) {
            showToast("No se pudo identificar al usuario.", "error");
            return;
        }

        const data = await showCocedorCaptureModal({
            cocedorId: id,
            title: "Registrar datos",
        });

        if (!data) {
            showToast("Registro cancelado.", "warning");
            return;
        }

        await runAction(btn, reloadFn, async () => {
            // Aquí validamos la consecutividad y construimos el payload.
            const consecutividadRes = await validarConsecutividadHoraXHora(data.relacion_id);
            handleServiceResponse(consecutividadRes, "No se pudo validar la consecutividad de la hora.");

            const payload = {
                relacion_id: data.relacion_id,
                fecha_hora: data.fecha,
                usuario_id,
                responsable_tipo: "CONTROL DE PROCESOS",
                tipo_registro: data.modo,
                param_agua: data.flujo,
                param_temp_entrada: data.tempEntrada,
                param_temp_salida: data.tempSalida,
                param_ph: data.ph,
                param_ntu: data.ntu,
                param_solidos: data.solidos,
                muestra_tomada: data.muestra,
                agitacion: data.agitacion,
                desengrasador: data.desengrasador,
                observaciones: consecutividadRes.ok ? data.observaciones : consecutividadRes.error,
            };

            const resDato = await registrarHoraXHora(payload);
            if(data.alerta != {}){
                alerta(data.alerta);
            }
            handleServiceResponse(resDato, "No se pudo guardar el registro.");
            showToast("Registro guardado correctamente.", "success");
        });
    },

    // Valida un registro de hora por hora de un cocedor.
    async validar({ id, btn, reloadFn }) {
        const usuario_id = getUserId();
        if (!usuario_id) {
            showToast("No se pudo identificar al usuario.", "error");
            return;
        }

        const res = await showCocedorValidateModal({
            cocedorId: id,
            title: "Validar registro",
            label: "Observaciones (opcional)",
            placeholder: "...",
        });

        if (!res) return;

        await runAction(btn, reloadFn, async () => {
            const payload = {
                id: usuario_id,
                detalle_id: res?.detalle_id,
                observaciones: res?.observaciones,
            };

            const ok = await validarHoraXHora(payload);
            handleServiceResponse(ok, "No se pudo validar el registro.");
            showToast("Registro validado correctamente.", "success");
        });
    },
};