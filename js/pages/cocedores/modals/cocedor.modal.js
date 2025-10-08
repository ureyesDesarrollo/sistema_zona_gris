// js/modals/cocedor.modal.js
import { createModal } from "../../../components/modals/modal.factory.js";
import { showToast } from "../../../components/toast.js";
import { obtenerCocedoresProcesoById, obtenerFlujos, obtenerTemperaturaCocedores } from "../../../services/cocedores.service.js";
import { getLocalDateTimeString } from "../../../utils/getLocalDateTimeString.js";
import { validarInputNumerico } from "../../../utils/isNumber.js";
import { RANGOS_VALIDACION, validarCampos } from "./rangosParametros.js";
import { getModalValue, getModalRadioValue, fetchHtml } from "../../../utils/modalUtils.js";

/**
 * Mapea los valores del formulario en un objeto de datos.
 * @param {HTMLElement} modalEl El elemento del modal.
 * @returns {object} El objeto de datos del formulario.
 */
const getFormData = (modalEl, cocedorId, payloadAlerta) => {
    return {
        cocedor_id: cocedorId,
        relacion_id: getModalValue(modalEl, "relacion-id"),
        fecha: getModalValue(modalEl, "fecha"),
        operador: getModalValue(modalEl, "operador"),
        flujo: getModalValue(modalEl, "flujo"),
        tempEntrada: getModalValue(modalEl, "temp-entrada"),
        tempSalida: getModalValue(modalEl, "temp-salida"),
        ph: getModalValue(modalEl, "ph"),
        ntu: getModalValue(modalEl, "ntu"),
        solidos: getModalValue(modalEl, "solidos"),
        muestra: getModalRadioValue(modalEl, "muestra"),
        agitacion: getModalRadioValue(modalEl, "agitacion"),
        desengrasador: getModalRadioValue(modalEl, "desengrasador"),
        modo: getModalRadioValue(modalEl, "modo"),
        observaciones: getModalValue(modalEl, "observaciones") || "N/A",
        alerta: payloadAlerta
    };
};

/**
 * Valida los campos del formulario y genera una alerta si es necesario.
 * @param {HTMLElement} modalEl El elemento del modal.
 * @param {number} cocedorId El ID del cocedor.
 * @returns {boolean} True si todos los campos son válidos, de lo contrario False.
 */
const validateFormData = (modalEl, cocedorId) => {
    let isValid = true;
    let hasEmptyField = false;
    const camposInvalidados = [];
    const hechosAlerta = [{ titulo: "Cocedor:", valor: cocedorId }];
    let payloadAlerta = {};
    const camposValidar = validarCampos(cocedorId);

    if (Number(modalEl.querySelector(`[data-modal-value="ntu"]`).value) > 1000) {
        modalEl.querySelector(`[data-modal-value="ntu"]`).classList.add('custom-modal-form-control-invalid');
        showToast("NTU debe ser menor o igual a 1000.", "warning");
    }

    camposValidar.forEach(campo => {
        const input = modalEl.querySelector(`[data-modal-value="${campo.id}"]`);
        if (!input.value) {
            input.classList.add('custom-modal-form-control-invalid');
            isValid = false;
            hasEmptyField = true;
            return;
        }
        const inputError = modalEl.querySelector(`[data-modal-error="${campo.id}"]`);
        const isCampoValido = validarInputNumerico(input, inputError, campo.rango);
        input.classList.toggle('custom-modal-form-control-invalid', !isCampoValido);

        if (!isCampoValido) {
            isValid = false;
            camposInvalidados.push({ campo, valor: input.value });
            hechosAlerta.push(
                { titulo: '📊 Parámetro:', valor: campo.nombre },
                { titulo: '📈 Valor detectado:', valor: input.value },
                { titulo: '✅ Rango permitido:', valor: `${campo.rango.min} - ${campo.rango.max}` },
            );
        }
    });

    

    if (camposInvalidados.length > 0) {
        hechosAlerta.push({
            titulo: "👤 Responsable de registro:",
            valor: getModalValue(modalEl, "operador")
        });

        payloadAlerta = {
            titulo: "🚨 Parámetros fuera o cerca del rango permitido",
            fecha: new Date().toLocaleString('sv-SE'),
            facts: hechosAlerta,
        };
    }

    const muestrasInvalidas = ["muestra", "agitacion", "desengrasador"]
        .map(name => getModalRadioValue(modalEl, name))
        .filter(val => val === "no" || val === "off");

    if (muestrasInvalidas.length > 0) {
        showToast("Verifica muestra, agitación y desengrasador.", "warning");
        isValid = false;
    }

    return { isValid, payloadAlerta, hasEmptyField };
};


//
const bindLiveValidation = (modalEl, cocedorId) => {
    const camposValidar = validarCampos(cocedorId);

    camposValidar.forEach(campo => {
        const input = modalEl.querySelector(`[data-modal-value="${campo.id}"]`);
        const inputError = modalEl.querySelector(`[data-modal-error="${campo.id}"]`);
        if (!input) return;

        input.addEventListener('input', () => {
            validarInputNumerico(input, inputError, campo.rango);
        });
    });
};

/**
 * Llena el formulario del modal con los datos obtenidos de la API.
 * @param {HTMLElement} modalEl El elemento del modal.
 * @param {object} datos Los datos del cocedor.
 * @param {Array} flujos Los datos de flujo.
 * @param {object} temperatura Los datos de temperatura.
 * @param {string} cocedorId El ID del cocedor.
 */
const preloadModalValues = (modalEl, datos, flujos, temperatura, cocedorId) => {
    if (!modalEl || !datos || !flujos || !temperatura || !cocedorId) return;
    const setValor = (id, valor) => {
        const el = modalEl.querySelector(`[data-modal-value="${id}"]`);
        if (el) el.value = valor;
    };

    const user = JSON.parse(localStorage.getItem('usuario') || 'null');
    const operador = user?.usuario_nombre ?? user?.usuario ?? 'Anonimo';
    const flujo = (flujos[0][`Flujo_cocedor_${cocedorId}`] == 0 || flujos[0][`Flujo_cocedor_${cocedorId}`] == null) ? 1 : flujos[0][`Flujo_cocedor_${cocedorId}`];
    const { COCEDORES_TEMPERATURA_DE_ENTRADA, COCEDORES_TEMPERATURA_DE_SALIDA } = temperatura;

    datos = datos.data;
    setValor('fecha', getLocalDateTimeString(new Date()));
    setValor('cocedor', `${datos.cocedor}, ${datos.agrupacion}`);
    setValor('relacion-id', datos.relacion_id);
    setValor('operador', operador);
    setValor('flujo', flujo);
    setValor('temp-entrada', COCEDORES_TEMPERATURA_DE_ENTRADA);
    setValor('temp-salida', COCEDORES_TEMPERATURA_DE_SALIDA);

    const { tempEntrada, tempSalida, flujo: rangosFlujo } = RANGOS_VALIDACION
    const flujoRango = rangosFlujo?.[cocedorId] ?? { min: 0, max: 0 };
    const isValidTempEntrada = COCEDORES_TEMPERATURA_DE_ENTRADA > tempEntrada.min && COCEDORES_TEMPERATURA_DE_ENTRADA < tempEntrada.max;
    const isValidTempSalida = COCEDORES_TEMPERATURA_DE_SALIDA > tempSalida.min && COCEDORES_TEMPERATURA_DE_SALIDA < tempSalida.max;
    const isValidFlujo = flujo > flujoRango.min && flujo < flujoRango.max;
    modalEl.querySelector(`[data-modal-value='temp-entrada']`)?.classList.toggle('c-form-control-invalid', !isValidTempEntrada);
    modalEl.querySelector(`[data-modal-value='temp-salida']`)?.classList.toggle('custom-modal-form-control-invalid', !isValidTempSalida);
    modalEl.querySelector(`[data-modal-value='flujo']`)?.classList.toggle('custom-modal-form-control-invalid', !isValidFlujo);
};


/**
 * Muestra el modal para la captura de parámetros del cocedor.
 * @param {object} config Configuración del modal.
 * @returns {Promise<object>} Los datos capturados o null si se cancela.
 */
export async function showCocedorCaptureModal(config = {}) {
    const {
        cocedorId,
        title = "Registro Cocedor",
        icon = "activity",
        size = "xl"
    } = config;

    if (!cocedorId) {
        showToast("No se proporcionó el cocedor.", "error");
        return null;
    }

    try {
        // 1. Carga de datos
        const [datos, flujos, temperatura] = await Promise.all([
            obtenerCocedoresProcesoById(cocedorId),
            obtenerFlujos(),
            obtenerTemperaturaCocedores(),
        ]);

        if (!datos || !flujos || !temperatura) {
            showToast("Datos del cocedor incompletos.", "error");
            return null;
        }

        // 2. Prepara el HTML y reemplaza
        const modalId = `custom-modal-${cocedorId}`;
        let rawHtml = await fetchHtml('views/cocedores/registrarHoraXHoraModal.html');
        rawHtml = rawHtml
            .replace(/\$\{modalId\}/g, modalId)
            .replace(/\$\{title\}/g, title)
            .replace(/\$\{icon\}/g, icon)
            .replace(/\$\{size\}/g, size);

        // 3. Usa createModal con onReady para inyectar los valores y listeners
        const onConfirm = (e, modalEl) => {
            e.preventDefault();
            const { isValid, payloadAlerta, hasEmptyField } = validateFormData(modalEl, cocedorId);
            if(hasEmptyField){
                showToast("No se permiten campos vacíos.", "warning");
                return;
            }
            return getFormData(modalEl, cocedorId, payloadAlerta);
        };

        const onReady = (modalEl) => {
            modalEl.querySelector(`[data-modal-value="solidos"]`).focus();
            preloadModalValues(modalEl, datos, flujos, temperatura, cocedorId);
            bindLiveValidation(modalEl, cocedorId);
        };

        return createModal(rawHtml, onConfirm, () => null, { backdrop: "static", keyboard: false }, onReady);

    } catch (error) {
        showToast("Ocurrió un error al cargar los datos del cocedor.", "error");
        console.error(error);
        return null;
    }
}
