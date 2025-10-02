import { createModal } from "../../../components/modals/modal.factory.js";
import { showToast } from "../../../components/toast.js";
import { getLocalDateTimeString } from "../../../utils/getLocalDateTimeString.js";
import { fetchHtml } from "../../../utils/modalUtils.js";
import { obtenerClarificadorProcesoById } from "../../../services/clarificador.service.js";
import { getUser } from "../../../utils/auth.js";
import { getModalValue, getModalRadioValue } from "../../../utils/modalUtils.js";
import { validarCampos } from "./rangosParametros.js";
import { validarInputNumerico } from "../../../utils/isNumber.js";
import { createFactParams, createFactReponsable, createPayloadAlerta } from "../../../utils/crearAlerta.js";

const preloadModalValues = (modalEl, datos) => {
    const user = getUser();
    const operador = user?.usuario_nombre ?? user?.usuario ?? 'Anonimo';
    const clarificadorIdEl = modalEl.querySelector('[data-modal-value="clarificador"]');
    clarificadorIdEl.value = `${datos.clarificador}, ${datos.agrupacion}`;
    const fechaEl = modalEl.querySelector('[data-modal-value="fecha"]');
    fechaEl.value = getLocalDateTimeString(new Date());
    const operadorEl = modalEl.querySelector('[data-modal-value="operador"]');
    operadorEl.value = operador;
    const relacionIdEl = modalEl.querySelector('[data-modal-value="relacion-id"]');
    relacionIdEl.value = datos.relacion_id;
    modalEl.querySelector('[data-modal-value="solidos-entrada"]').focus();
}

const getFormData = (modalEl, clarificadorId, payloadAlerta) => {
    return {
        clarificador_id: clarificadorId,
        relacion_id: getModalValue(modalEl, "relacion-id"),
        fecha: getModalValue(modalEl, "fecha"),
        solidos_entrada: getModalValue(modalEl, "solidos-entrada"),
        ntu_entrada: getModalValue(modalEl, "ntu-entrada"),
        ntu_salida: getModalValue(modalEl, "ntu-salida"),
        ph_entrada: getModalValue(modalEl, "ph-entrada"),
        ph_electrodo: getModalValue(modalEl, "ph-electrodo"),
        ph_control_procesos: getModalValue(modalEl, "ph-control-proceso"),
        presion: getModalValue(modalEl, "presion"),
        entrada_aire: getModalValue(modalEl, "entrada-aire"),
        varometro: getModalValue(modalEl, "varometro"),
        nivel_nata: getModalValue(modalEl, "nivel-nata"),
        filtros: getModalValue(modalEl, "filtros"),
        cambio_filtro: getModalRadioValue(modalEl, "cambio-filtro"),
    };
};


const validateFormData = (modalEl) => {
    let isValid = true;
    const camposInvalidados = [];
    const camposValidar = validarCampos();
    const factsAlerta = [];
    let payloadAlerta = {};

    camposValidar.forEach(campo => {
        const input = modalEl.querySelector(`[data-modal-value="${campo.id}"]`);
        if (!input.value) {
            input.classList.add('custom-form-control-invalid');
            isValid = false;
            return;
        }

        const inputError = modalEl.querySelector(`[data-modal-error="${campo.id}"]`);
        const isCampoValido = validarInputNumerico(input, inputError, campo.rango);
        input.classList.toggle('custom-form-control-invalid', !isCampoValido);

        if(!isCampoValido){
            isValid = false;
            camposInvalidados.push({campo, valor: input.value});
            factsAlerta.push(...createFactParams(campo, input));
        }
    });

    if(camposInvalidados.length > 0){
        factsAlerta.push(createFactReponsable(getModalValue(modalEl, "operador")));
    }

    payloadAlerta = createPayloadAlerta(factsAlerta);
    return { isValid, payloadAlerta };

}

const bindLiveValidation = (modalEl) => {
    const camposValidar = validarCampos();
    camposValidar.forEach(campo => {
        const input = modalEl.querySelector(`[data-modal-value="${campo.id}"]`);
        const inputError = modalEl.querySelector(`[data-modal-error="${campo.id}"]`);
        if (!input) return;

        input.addEventListener('input', () => {
            validarInputNumerico(input, inputError, campo.rango);
        });
    });
};


export async function showClarificadorModal(config = {}) {
    const {
        clarificadorId,
        title = "Registro Clarificador",
        icon = "activity",
        size = "xl"
    } = config;


    if (!clarificadorId) {
        showToast("No se proporcionó el clarificador", "error");
        return;
    }

    try {

        //1. Carga de datos
        const [datos] = await Promise.all([
            obtenerClarificadorProcesoById(clarificadorId),
        ]);
        if (!datos) {
            showToast("Datos del clarificador incompletos.", "error");
            return null;
        }

        const user = getUser();
        // 2. Prepara el HTML y reemplaza
        const modalId = `clarificador-modal-${clarificadorId}`;
        let rawHtml = await fetchHtml('views/clarificador/registroParametros.html');
        rawHtml = rawHtml
            .replace(/\$\{modalId\}/g, modalId)
            .replace(/\$\{title\}/g, title)
            .replace(/\$\{icon\}/g, icon)
            .replace(/\$\{size\}/g, size);


        // 3. Usa createModal con onReady para inyectar los valores y listeners
        const onConfirm = (e, modalEl) => {
            e.preventDefault();
            const { isValid, payloadAlerta } = validateFormData(modalEl);
            console.log(payloadAlerta);
            if (!isValid) return;
            return getFormData(modalEl, clarificadorId, payloadAlerta);
        };

        const onReady = (modalEl) => {
            preloadModalValues(modalEl, datos);
            bindLiveValidation(modalEl);
        };

        return createModal(rawHtml, onConfirm, () => null, { backdrop: "static", keyboard: false }, onReady);

    } catch (error) {
        console.error(error);
        showToast("Error al cargar el modal", "error");
    }
}