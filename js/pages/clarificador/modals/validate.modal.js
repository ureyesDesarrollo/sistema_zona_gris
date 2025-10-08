import { createModal } from "../../../components/modals/modal.factory.js";
import { showToast } from "../../../components/toast.js";
import { fetchHtml } from "../../../utils/modalUtils.js";

export async function showClarificadorValidateModal(config = {}) {
    const { clarificadorId, title = "Validación de datos", icon = "activity", size = "xl" } = config;

    if (!clarificadorId) {
        showToast("No se proporcionó el clarificador", "error");
        return;
    }

    try {
        //1. Carga de datos

        //2. Preparamos el HTML
        const modalId = `cocedor-modal-${clarificadorId}`;
        let rawHtml = await fetchHtml('views/clarificador/validarRegistro.html');
        rawHtml = rawHtml
            .replace(/\$\{modalId\}/g, modalId)
            .replace(/\$\{title\}/g, title)
            .replace(/\$\{icon\}/g, icon)
            .replace(/\$\{size\}/g, size);
        
            const onConfirm = (e, modalId) => {

        }

        const onReady = (modalEl) => {
            
        }

        return createModal(rawHtml, onConfirm, () => null, { backdrop: "static", keyboard: false }, onReady);
    }catch (error) {
        showToast("Error al validar el clarificador", "error");
        console.error(error);
    }
}