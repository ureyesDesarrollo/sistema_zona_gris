import { validarCampos, RANGOS_VALIDACION } from "./rangosParametros.js";
import { showToast } from "../../../components/toast.js";
import { obtenerDetelleCocedorProceso } from "../../../services/cocedores.service.js";
import { createModal } from "../../../components/modals/modal.factory.js";
import { getUser } from "../../../utils/auth.js";
import { validate } from "../../../utils/observationValidate.js";
import { fetchHtml, setValor } from "../../../utils/modalUtils.js";

/**
 * Llena el formulario del modal con los datos obtenidos de la API.
 * @param {HTMLElement} modalEl El elemento del modal.
 * @param {object} datos Los datos del cocedor.
 * @param {string} cocedorId El ID del cocedor.
 */
const preloadModalValues = (modalEl, datos, cocedorId) => {
    if (!modalEl || !datos || !cocedorId) return;

    const user = getUser();

    setValor(modalEl, 'fecha', datos.fecha_hora);
    setValor(modalEl, 'cocedor', `${datos.cocedor}, ${datos.agrupacion}`);
    setValor(modalEl, 'relacion-id', datos.detalle_id);
    setValor(modalEl, 'operador', datos.responsable);
    setValor(modalEl, 'flujo', datos.param_agua);
    setValor(modalEl, 'temp-entrada', datos.param_temp_entrada);
    setValor(modalEl, 'temp-salida', datos.param_temp_salida);
    setValor(modalEl, 'solidos', datos.param_solidos);
    setValor(modalEl, 'ph', datos.param_ph);
    setValor(modalEl, 'ntu', datos.param_ntu);
    setValor(modalEl, 'observaciones', datos.observaciones);
    setValor(modalEl, 'supervisor-validado', user.usuario_nombre);

    const { tempEntrada, tempSalida, flujo: rangosFlujo, solidos, ph, ntu } = RANGOS_VALIDACION
    const flujoRango = rangosFlujo?.[cocedorId] ?? { min: 0, max: 0 };
    const isValidTempEntrada = datos.param_temp_entrada > tempEntrada.min && datos.param_temp_entrada < tempEntrada.max;
    const isValidTempSalida = datos.param_temp_salida > tempSalida.min && datos.param_temp_salida < tempSalida.max;
    const isValidFlujo = datos.param_agua > flujoRango.min && datos.param_agua < flujoRango.max;
    const isValidSolidos = datos.param_solidos > solidos.min && datos.param_solidos < solidos.max;
    const isValidPh = datos.param_ph > ph.min && datos.param_ph < ph.max;
    const isValidNtu = datos.param_ntu > ntu.min && datos.param_ntu < ntu.max;
    modalEl.querySelector(`[data-modal-value='temp-entrada']`)?.classList.toggle('custom-modal-form-control-invalid', !isValidTempEntrada);
    modalEl.querySelector(`[data-modal-value='temp-salida']`)?.classList.toggle('custom-modal-form-control-invalid', !isValidTempSalida);
    modalEl.querySelector(`[data-modal-value='flujo']`)?.classList.toggle('custom-modal-form-control-invalid', !isValidFlujo);
    modalEl.querySelector(`[data-modal-value='solidos']`)?.classList.toggle('custom-modal-form-control-invalid', !isValidSolidos);
    modalEl.querySelector(`[data-modal-value='ph']`)?.classList.toggle('custom-modal-form-control-invalid', !isValidPh);
    modalEl.querySelector(`[data-modal-value='ntu']`)?.classList.toggle('custom-modal-form-control-invalid', !isValidNtu);

    if (datos.supervisor_validado === '1') {
        modalEl.querySelector('[data-modal-value="status-indicator-text"]').classList.replace('status-pending', 'status-validado');
        modalEl.querySelector('[data-modal-value="status-indicator-text"]').textContent = 'Validado';
    } else {
        modalEl.querySelector('[data-modal-value="status-indicator-text"]').classList.replace('status-validado', 'status-pending');
        modalEl.querySelector('[data-modal-value="status-indicator-text"]').textContent = 'Pendiente';
    }
};

export async function showCocedorValidateModal(config = {}) {
    const {
        cocedorId,
        title = "Validación de datos",
        icon = "activity",
        size = "xl"
    } = config;

    if (!cocedorId) {
        showToast("No se proporcionó el cocedor.", "error");
        return null;
    }

    try {
        // 1. Carga de datos
        const [datos] = await Promise.all([
            obtenerDetelleCocedorProceso(cocedorId),

        ]);

        if (!datos) {
            showToast("Datos del cocedor incompletos.", "error");
            return null;
        }

        // 2. Preparamos el HTML
        const modalId = `cocedor-modal-${cocedorId}`;
        let rawHtml = await fetchHtml('views/cocedores/validarHoraXHoraModal.html');
        rawHtml = rawHtml
            .replace(/\$\{modalId\}/g, modalId)
            .replace(/\$\{title\}/g, title)
            .replace(/\$\{icon\}/g, icon)
            .replace(/\$\{size\}/g, size);

        // 3. Usamos createModal con onReady para inyectar los valores y listeners
        const onConfirm = (e, modalEl) => {
            e.preventDefault();
            const comentarios = modalEl.querySelector('[data-modal-value="comentarios-validacion"]').value;
            const validation = validate(comentarios, { minLength: 20 });

            if (!validation.isValid) {
                modalEl.querySelector('[data-modal-value="comentarios-validacion"]').classList.add('custom-modal-form-control-invalid');

                const messages = {
                    'empty': "Debe ingresar comentarios de validación.",
                    'length': "Debe ingresar al menos 20 caracteres.",
                    'repetitive': "El texto es demasiado repetitivo. Ingrese comentarios significativos.",
                    'sequence': "Evite secuencias repetidas de caracteres."
                };

                showToast(messages[validation.reason], 'warning');
                return false;
            }

            return {
                observaciones: comentarios,
                detalle_id: datos.detalle_id
            };

        };

        const onReady = (modalEl) => {
            const comentarioInput = modalEl.querySelector('[data-modal-value="comentarios-validacion"]');
            preloadModalValues(modalEl, datos, cocedorId);
          
            if (comentarioInput) {
              // Validación inicial (por si ya venía con datos)
              const valor = comentarioInput.value?.trim() || "";
              if (comentarioInput.classList.contains('custom-modal-form-control-invalid') && valor.length >= 20) {
                comentarioInput.classList.remove('custom-modal-form-control-invalid');
              }
          
              // Listener para validar en tiempo real mientras escribe
              comentarioInput.addEventListener('input', () => {
                const val = comentarioInput.value.trim();
                if (val.length >= 20) {
                  comentarioInput.classList.remove('custom-modal-form-control-invalid');
                }
              });
            }
          
          };
          

        return createModal(rawHtml, onConfirm, () => null, { backdrop: "static", keyboard: false }, onReady);

    } catch (error) {
        showToast("Ocurrió un error al cargar los datos del cocedor.", "error");
        console.error(error);
        return null;
    }
}
