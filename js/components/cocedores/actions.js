import { changeStatus, registrarParo, finalizarParo, vaidarConsecutividadHoraXHora, registrarHoraXHora, validarHoraXHora } from "../../services/cocedores.service.js";
import { showCocedorCaptureModal, showCocedorValidateModal, showConfirm, showMaintenanceModal } from "../modal.js";
import { showToast } from "../toast.js";
import { getUserId } from "../../utils/session.js";

const runAction = async (btn, reloadFn, fn) => {
    if (btn.getAttribute("data-in-flight") === "1") return;
    btn.setAttribute("data-in-flight", "1");
    btn.disabled = true;
    try {
        await fn();
        if (typeof reloadFn === "function") await reloadFn();
    } catch (e) {
        showToast(e?.message || "Ocurrió un error inesperado.", false);
    } finally {
        btn.disabled = false;
        btn.removeAttribute("data-in-flight");
    }
};

export const ACTIONS = {
    // Pausar (mantenimiento)
    async pause({ id, btn, reloadFn }) {
        const ok = await showConfirm(
            "¿Está seguro de poner este cocedor en mantenimiento?"
        );
        if (!ok) return;

        const motivo = await showMaintenanceModal({
            title: "Motivo del paro por mantenimiento",
        });
        if (!motivo) {
            showToast("Operación cancelada: motivo no proporcionado.", false);
            return;
        }

        const usuario_id = getUserId();
        if (!usuario_id) {
            showToast("No se pudo identificar al usuario.", false);
            return;
        }

        await runAction(btn, reloadFn, async () => {
            const res = await changeStatus(id, "MANTENIMIENTO");
            if (!res) throw new Error("No se pudo cambiar el estatus.");

            const paroRes = await registrarParo({ cocedor_id: id, motivo, usuario_id });
            if (!paroRes) throw new Error(paroRes?.error || "No se pudo registrar el paro.");

            showToast("Cocedor puesto en mantenimiento.", true);
        });
    },

    // Activar
    async activate({ id, btn, reloadFn }) {
        const ok = await showConfirm("¿Desea activar este cocedor?");
        if (!ok) return;

        const observaciones =
            (await showMaintenanceModal({
                title: "Observaciones para activar",
                label: "Observaciones",
                placeholder: "Describa observaciones de la activación...",
            })) || "";
        if (!observaciones) {
            showToast(
                "Activación cancelada: observaciones no proporcionadas.",
                false
            );
            return;
        }

        const usuario_id = getUserId();
        if (!usuario_id) {
            showToast("No se pudo identificar al usuario.", false);
            return;
        }

        await runAction(btn, reloadFn, async () => {
            const finRes = await finalizarParo({ cocedor_id: id, observaciones, usuario_id });
            if (!finRes?.data)
                throw new Error(finRes?.error || "No se pudo finalizar el paro.");

            const res = await changeStatus(id, "ACTIVO");
            if (!res) throw new Error("No se pudo cambiar el estatus.");

            showToast("Cocedor activado.", true);
        });
    },

    // Registrar (opcional; asegúrate de tener el endpoint)
    async registrar({ id, btn, reloadFn }) {
        const usuario_id = getUserId();
        if (!usuario_id) { showToast("No se pudo identificar al usuario.", false); return; }

        // Ahora data trae __modalId
        const data = await showCocedorCaptureModal({ cocedorId: id, title: "Registrar datos" });
        if (!data) { showToast("Registro cancelado.", false); return; }

        await runAction(btn, reloadFn, async () => {
            const res = await vaidarConsecutividadHoraXHora(data.relacion_id);
            if (!res?.ok){
                showToast(res?.error || "Hora anterior no registrada", {type: 'danger'});
                showToast("Se debe registrar la hora anterior para continuar, solicite al supervisor la autorización", options = {type: 'warning'});
                return false;

            }

            const payload = {
                relacion_id: data.relacion_id,
                fecha_hora: data.fecha,
                usuario_id,
                responsable_tipo: 'CONTROL DE PROCESOS',
                tipo_registro: data.modo,
                param_agua: data.flujo,
                param_temp_entrada: data.tempEntrada,
                param_temp_salida: data.tempSalida,
                peso_consumido: data.cargaCuero,
                param_ph: data.ph,
                param_ntu: data.ntu,
                param_solidos: data.solidos,
                muestra_tomada: data.muestra,
                agitacion: data.agitacion,
                desengrasador: data.desengrasador,
                observaciones: data.observaciones
            };

            const resDato = await registrarHoraXHora(payload);

            if (!resDato?.success) {
                const msg = resDato?.errors
                    ? Object.entries(resDato.errors)
                        .map(([field, msgs]) => `• ${field}: ${[].concat(msgs).join(" ")}`)
                        .join("\n")
                    : (resDato?.error || "No se pudo guardar.");
                showToast(msg, false);
                // 🔸 Importante: NO cerramos el modal en error
                return;
            }

            showToast("Registro guardado correctamente.", true);

            // ✅ Cerrar modal SOLO en éxito
            const modalEl = document.getElementById(data.__modalId ?? `cocedor-modal-${id}`);
            const instance = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
            instance?.hide();
        });
    },

    // Validar (opcional)
    async validar({ id, btn, reloadFn }) {
        const usuario_id = getUserId();
        if (!usuario_id) {
            showToast("No se pudo identificar al usuario.", false);
            return;
        }

        const res =
            (await showCocedorValidateModal({
                cocedorId: id,
                title: "Validar registro",
                label: "Observaciones (opcional)",
                placeholder: "...",
            })) || "";

        await runAction(btn, reloadFn, async () => {
            const payload = {
                id: usuario_id,
                detalle_id: res?.relacion_id
            };


            const ok = await validarHoraXHora(payload);
            if (!ok?.data) throw new Error(ok?.error || "No se pudo validar el registro.");
            showToast("Registro validado correctamente.", true);
        });
    },
};