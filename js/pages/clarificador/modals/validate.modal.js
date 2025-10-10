import { createModal } from "../../../components/modals/modal.factory.js";
import { showToast } from "../../../components/toast.js";
import { obtenerDetalleClarificadorProceso } from "../../../services/clarificador.service.js";
import { getUser } from "../../../utils/auth.js";
import { validarInputNumerico } from "../../../utils/isNumber.js";
import { fetchHtml, setValor } from "../../../utils/modalUtils.js";
import { validate } from "../../../utils/observationValidate.js";
import { validarCampos } from "./rangosParametros.js";

const preloadModalValues = (modalEl, datos, clarificadorId) => {
  if (!modalEl || !datos || !clarificadorId) return;
  console.log(datos);
  const user = getUser();

  setValor(modalEl, "fecha", datos.fecha_hora);
  setValor(
    modalEl,
    "clarificador",
    `${datos.clarificador}, ${datos.agrupacion}`
  );
  setValor(modalEl, "relacion-id", datos.detalle_id);
  setValor(modalEl, "operador", datos.responsable);
  setValor(modalEl, "solidos-entrada", datos.param_solidos_entrada);
  setValor(modalEl, "flujo-salida", datos.param_flujo_salida);
  setValor(modalEl, "ntu-entrada", datos.param_ntu_entrada);
  setValor(modalEl, "ntu-salida", datos.param_ntu_salida);
  setValor(modalEl, "ph-entrada", datos.param_ph_entrada);
  setValor(modalEl, "ph-electrodo", datos.param_ph_electrodo);
  setValor(modalEl, "ph-control-procesos", datos.param_ph_control);
  setValor(modalEl, "dosificacion-polimero", datos.param_dosificacion_polimero);
  setValor(modalEl, "tanque", datos.tanque);
  setValor(modalEl, "tanque-hora-inicio", datos.tanque_hora_inicio);
  setValor(modalEl, "tanque-hora-fin", datos.tanque_hora_fin);
  setValor(modalEl, "presion", datos.param_presion);
  setValor(modalEl, "entrada-aire", datos.param_entrada_aire);
  setValor(modalEl, "varometro", datos.param_varometro);
  setValor(modalEl, "nivel-nata", datos.param_nivel_nata);
  setValor(modalEl, "filtro-1", datos.param_filtro_1);
  setValor(modalEl, "filtro-2", datos.param_filtro_2);
  setValor(modalEl, "filtro-3", datos.param_filtro_3);
  setValor(modalEl, "filtro-4", datos.param_filtro_4);
  setValor(modalEl, "filtro-5", datos.param_filtro_5);
  setValor(modalEl, "observaciones", datos.observaciones);
  setValor(modalEl, "supervisor-validado", user.usuario_nombre);

  const camposValidar = validarCampos();

  camposValidar.forEach((campo) => {
    const input = modalEl.querySelector(`[data-modal-value="${campo.id}"]`);
    const isCampoValido = validarInputNumerico(input, null, campo.rango);
    input.classList.toggle("custom-modal-form-control-invalid", !isCampoValido);
  });

  if (datos.supervisor_validado == "1") {
    modalEl.querySelector('[data-modal-value="status-indicator-supervisor"]')
      .classList.replace("status-pending", "status-approved");
    modalEl.querySelector(
      '[data-modal-value="status-indicator-text-supervisor"]'
    ).textContent = "Validado";
  } else {
    modalEl
      .querySelector('[data-modal-value="status-indicator-supervisor"]')
      .classList.replace("status-approved", "status-pending");
    modalEl.querySelector(
      '[data-modal-value="status-indicator-text-supervisor"]'
    ).textContent = "Pendiente";
  }

  if (datos.control_procesos_validado == "1") {
    modalEl
      .querySelector('[data-modal-value="status-indicator-procesos"]')
      .classList.replace("status-pending", "status-approved");
    modalEl.querySelector(
      '[data-modal-value="status-indicator-text-procesos"]'
    ).textContent = "Validado";
  } else {
    modalEl
      .querySelector('[data-modal-value="status-indicator-procesos"]')
      .classList.replace("status-approved", "status-pending");
    modalEl.querySelector(
      '[data-modal-value="status-indicator-text-procesos"]'
    ).textContent = "Pendiente";
  }
};

export async function showClarificadorValidateModal(config = {}) {
  const {
    clarificadorId,
    title = "Validación de datos",
    icon = "activity",
    size = "xl",
  } = config;

  if (!clarificadorId) {
    showToast("No se proporcionó el clarificador", "error");
    return;
  }

  try {
    //1. Carga de datos
    const [datos] = await Promise.all([
      obtenerDetalleClarificadorProceso(clarificadorId),
    ]);

    if (!datos) {
      showToast("Datos del clarificador incompletos.", "error");
      return null;
    }
    //2. Preparamos el HTML
    const modalId = `cocedor-modal-${clarificadorId}`;
    let rawHtml = await fetchHtml("views/clarificador/validarRegistro.html");
    rawHtml = rawHtml
      .replace(/\$\{modalId\}/g, modalId)
      .replace(/\$\{title\}/g, title)
      .replace(/\$\{icon\}/g, icon)
      .replace(/\$\{size\}/g, size);

    const onConfirm = (e, modalEl) => {
      e.preventDefault();
      const user = getUser();
      const comentarios = modalEl.querySelector(
        '[data-modal-value="comentarios-validacion"]'
      ).value;
      const validation = validate(comentarios, { minLength: 20 });

      if (!validation.isValid) {
        modalEl
          .querySelector('[data-modal-value="comentarios-validacion"]')
          .classList.add("custom-modal-form-control-invalid");

        const messages = {
          empty: "Debe ingresar comentarios de validación.",
          length: "Debe ingresar al menos 20 caracteres.",
          repetitive:
            "El texto es demasiado repetitivo. Ingrese comentarios significativos.",
          sequence: "Evite secuencias repetidas de caracteres.",
        };

        showToast(messages[validation.reason], "warning");
        return false;
      }

      return {
        observaciones: comentarios,
        detalle_id: datos.detalle_id,
        id: user.user_id,
        isSupervisor: user.perfil !== 'Laboratorio' ? true : false
      };
    };

    const onReady = (modalEl) => {
      const comentarioInput = modalEl.querySelector(
        '[data-modal-value="comentarios-validacion"]'
      );
      preloadModalValues(modalEl, datos, clarificadorId);
      if (comentarioInput) {
        // Validación inicial (por si ya venía con datos)
        const valor = comentarioInput.value?.trim() || "";
        if (
          comentarioInput.classList.contains(
            "custom-modal-form-control-invalid"
          ) &&
          valor.length >= 20
        ) {
          comentarioInput.classList.remove("custom-modal-form-control-invalid");
        }

        // Listener para validar en tiempo real mientras escribe
        comentarioInput.addEventListener("input", () => {
          const val = comentarioInput.value.trim();
          if (val.length >= 20) {
            comentarioInput.classList.remove(
              "custom-modal-form-control-invalid"
            );
          }
        });
      }
    };

    return createModal(
      rawHtml,
      onConfirm,
      () => null,
      { backdrop: "static", keyboard: false },
      onReady
    );
  } catch (error) {
    showToast("Error al validar el clarificador", "error");
    console.error(error);
  }
}
