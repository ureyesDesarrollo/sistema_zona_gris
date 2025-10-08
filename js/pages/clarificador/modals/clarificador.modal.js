import { createModal } from "../../../components/modals/modal.factory.js";
import { showToast } from "../../../components/toast.js";
import { getLocalDateTimeString } from "../../../utils/getLocalDateTimeString.js";
import { fetchHtml } from "../../../utils/modalUtils.js";
import { obtenerClarificadorProcesoById } from "../../../services/clarificador.service.js";
import { getUser } from "../../../utils/auth.js";
import { getModalValue, getModalRadioValue } from "../../../utils/modalUtils.js";
import { validarCampos } from "./rangosParametros.js";
import { validarInputNumerico } from "../../../utils/isNumber.js";
import { createEquipo, createFactParams, createFactResponsable, createPayloadAlerta } from "../../../utils/crearAlerta.js";

const preloadModalValues = (modalEl, datos) => {
    const now = new Date();
    const currentMinutes = now.getMinutes();

    const dt1 = new Date(now);
    const dt2 = new Date(now);

    if (currentMinutes < 30) {
        // Si son menos de 30 minutos, usar hora:00 y hora:30
        dt1.setMinutes(0, 0, 0);
        dt2.setMinutes(30, 0, 0);
    } else {
        // Si son 30 minutos o más, usar hora:30 y (hora+1):00
        dt1.setMinutes(30, 0, 0);
        dt2.setHours(dt2.getHours() + 1);
        dt2.setMinutes(0, 0, 0);
    }

    const tanqueHoraInicioEl = modalEl.querySelector('[data-modal-value="tanque-hora-inicio"]');
    tanqueHoraInicioEl.value = getLocalDateTimeString(dt1);
    const tanqueHoraFinEl = modalEl.querySelector('[data-modal-value="tanque-hora-fin"]');
    tanqueHoraFinEl.value = getLocalDateTimeString(dt2);
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
    const user = getUser();
    const val = getModalRadioValue(modalEl, "cambio-filtro");
    const cambio_filtro = val === "Si" ? 1 : 0;
    return {
        relacion_id: getModalValue(modalEl, "relacion-id"),
        usuario_id: user?.user_id ?? null,
        responsable_tipo: user?.usuario === "laboratorio" ? "CONTROL DE PROCESOS" : "OPERADOR",
        param_solidos_entrada: getModalValue(modalEl, "solidos-entrada"),
        param_flujo_salida: getModalValue(modalEl, "flujo-salida"),
        param_ntu_entrada: getModalValue(modalEl, "ntu-entrada"),
        param_ntu_salida: getModalValue(modalEl, "ntu-salida"),
        param_ph_entrada: getModalValue(modalEl, "ph-entrada"),
        param_ph_electrodo: getModalValue(modalEl, "ph-electrodo"),
        param_ph_control: getModalValue(modalEl, "ph-control-procesos"),
        param_dosificacion_polimero: getModalValue(modalEl, "dosificacion-polimero"),
        tanque: getModalValue(modalEl, "tanque"),
        tanque_hora_inicio: getModalValue(modalEl, "tanque-hora-inicio"),
        tanque_hora_fin: getModalValue(modalEl, "tanque-hora-fin"),
        param_presion: getModalValue(modalEl, "presion"),
        param_entrada_aire: getModalValue(modalEl, "entrada-aire"),
        param_varometro: getModalValue(modalEl, "varometro"),
        param_nivel_nata: getModalValue(modalEl, "nivel-nata"),
        param_filtro_1: getModalValue(modalEl, "filtro-1"),
        param_filtro_2: getModalValue(modalEl, "filtro-2"),
        param_filtro_3: getModalValue(modalEl, "filtro-3"),
        param_filtro_4: getModalValue(modalEl, "filtro-4"),
        param_filtro_5: getModalValue(modalEl, "filtro-5"),
        cambio_filtro,
        payloadAlerta
    };
};


const validateFormData = (modalEl) => {
    let isValid = true;
    let hasEmptyField = false;
    const camposInvalidados = [];
    const camposValidar = validarCampos();
    const factsAlerta = [createEquipo("Clarificador")];
    let payloadAlerta = {};

    camposValidar.forEach(campo => {

        const input = modalEl.querySelector(`[data-modal-value="${campo.id}"]`);
        if (!input.value) {
            if (!campo.requerido) return;
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
            factsAlerta.push(...createFactParams(campo, input));
        }
    });

    if (camposInvalidados.length > 0) {
        factsAlerta.push(createFactResponsable(getModalValue(modalEl, "operador")));
    }

    payloadAlerta = createPayloadAlerta(factsAlerta);
    return { isValid, payloadAlerta, hasEmptyField };

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
            //console.log(getFormData(modalEl, clarificadorId, {}));

            const { isValid, payloadAlerta, hasEmptyField } = validateFormData(modalEl);
            if (hasEmptyField) {
                showToast("No se permiten campos vacíos.", "warning");
                return;
            }

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