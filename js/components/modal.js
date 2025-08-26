import { alerta, obtenerCocedoresProcesoById, obtenerDetelleCocedorProceso, obtenerFlujos, obtenerTemperaturaCocedores } from "../services/cocedores.service.js";
import { debounce } from "../utils/debounce.js";
import { formatter } from "../utils/formatter.js";
import { getLocalDateTimeString } from "../utils/getLocalDateTimeString.js";
import { validarInputNumerico } from "../utils/isNumber.js";
import { showToast } from "./toast.js";

export const showConfirm = (message, title = 'Confirmación', options = {}) => {
  return new Promise((resolve) => {
    let settled = false;
    const safeResolve = (val) => { if (!settled) { settled = true; resolve(val); } };

    const { okText = 'Aceptar', cancelText = 'Cancelar', okClass = 'btn-primary', cancelClass = 'btn-outline-secondary', icon = 'triangle-alert' } = options;
    const modalId = 'confirmModal-' + Date.now();
    const modalHtml = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}-label" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="${modalId}-label">
                <i data-lucide="${icon}" class="text-warning me-2"></i>${title}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              <p id="${modalId}-msg" class="mb-0"></p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn ${cancelClass}" data-bs-dismiss="modal">${cancelText}</button>
              <button type="button" class="btn ${okClass}" id="${modalId}-ok">${okText}</button>
            </div>
          </div>
        </div>
      </div>`;

    const temp = document.createElement('div');
    temp.innerHTML = modalHtml;
    document.body.appendChild(temp);

    const modalEl = temp.querySelector('#' + modalId);
    const msgEl = temp.querySelector('#' + modalId + '-msg');
    msgEl.textContent = message; // evita inyección
    const okBtn = temp.querySelector('#' + modalId + '-ok');
    const modal = new bootstrap.Modal(modalEl);

    modalEl.addEventListener('shown.bs.modal', () => {
      modalEl.querySelector('[data-bs-dismiss="modal"]')?.focus();
      window.lucide?.createIcons?.();
      // Enter confirma, Esc cancela (Bootstrap ya maneja Esc)
      modalEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { okBtn.click(); }
      }, { once: true });
    });

    okBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      safeResolve(true);
      modal.hide();
    });

    modalEl.addEventListener('hidden.bs.modal', () => {
      temp.remove();
      safeResolve(false); // si se cerró sin confirmar
    });

    modal.show();
  });
};


/**
 * 1. Plantilla HTML del modal (sin lógica)
 */
function processCocedorModalHtml({ modalId, title, procesos, cocedores, allowMultiple, minSelection, selectText, cancelText }) {
  return `<div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}-label" style="display: block; padding-top: 5%;">
  <div class="modal-dialog modal-lg">
    <div class="modal-content border-0 shadow-lg" style="border-radius: 12px; border: 1px solid #e0e0e0;">
      <div class="modal-header py-3" style="background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border-bottom: 1px solid #e0e0e0; border-radius: 12px 12px 0 0;">
        <div class="d-flex flex-column w-100">
          <div class="d-flex justify-content-between align-items-center">
            <h3 class="modal-title m-0" id="${modalId}-label" style="font-size: 1.4rem; font-weight: 600; color: #2c3e50;">
              <i data-lucide="factory" style="color: #3498db; width: 30px; height: 30px;"></i>
              ${title}
            </h3>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" style="font-size: 0.8rem;"></button>
          </div>
          <div class="mt-2 text-muted" style="font-size: 0.9rem;">
            <i data-lucide="info" style="color: #3498db; width: 20px; height: 20px;"></i> ${allowMultiple ? 'Seleccione uno o más procesos para continuar' : 'Seleccione un proceso para continuar'}
          </div>
        </div>
      </div>
      <div class="modal-body p-0" style="max-height: 65vh; overflow-y: auto;">
        <div class="p-3 border-bottom">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-semibold text-primary m-0">Procesos Disponibles</h5>
          </div>
          <div class="list-group">
            ${procesos.map(proceso => procesosHtml(proceso)).join('')}
          </div>
        </div>
        <div id="cocedoresSection" class="p-3 border-top" style="display: none; animation: fadeIn 0.6s;">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-semibold text-success m-0">
              <i data-lucide="flame" style="width: 20px; height: 20px;"></i> Cocedores Activos
            </h5>
            <span id="cocedoresHelper" class="text-muted" style="font-size: 0.85rem;">
              Seleccione uno o más cocedores disponibles
            </span>
          </div>
          <div class="row g-2">
            ${cocedores.map(cocedor => cocedoresHtml(cocedor)).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer py-3 px-4" style="background: #f8f9fa;border-radius: 0 0 12px 12px;border-top: 1px solid #e0e0e0;">
        <div id="selectionWarning" class="text-danger small me-auto" style="display: none;font-size: 0.85rem;">
          <i data-lucide="alert-circle" style="width: 20px; height: 20px;"></i> Debe seleccionar al menos ${minSelection} proceso(s) y un cocedor
        </div>
        <button type="button" class="btn btn-sm btn-outline-secondary px-3" data-bs-dismiss="modal" style="font-size: 0.9rem;padding: 0.5rem 1rem;">
          <i data-lucide="x" style="width: 20px; height: 20px;"></i> ${cancelText}
        </button>
        <button type="button" id="confirmSelection" class="btn btn-sm btn-primary px-3" disabled style="font-size: 0.9rem;padding: 0.5rem 1rem;">
          <i data-lucide="check" style="width: 20px; height: 20px;"></i> ${selectText}
        </button>
      </div>
    </div>
  </div>
</div>
`;
}

/**
 * 2. Estilos y animación (una sola vez por documento)
 */
function injectProcessModalStyles() {
  if (!document.getElementById('process-modal-style')) {
    const style = document.createElement('style');
    style.id = 'process-modal-style';
    style.textContent = `
    @keyframes fadeIn { from { opacity: 0; transform: translateY(25px); } to { opacity: 1; transform: none; } }
    .cocedor-selector:checked + .cocedor-label { border-color: #0d6efd; background-color: #f8faff; }
    .cocedor-selector:checked + .cocedor-label .cocedor-checkbox { background-color: #0d6efd; border-color: #0d6efd; }
    .cocedor-selector:checked + .cocedor-label .cocedor-checkbox i { display: block !important; }
    .cocedor-selector:focus + .cocedor-label { box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25); }
    .cocedor-label:hover { border-color: #adb5bd !important; }
    `;
    document.head.appendChild(style);
  }
}

/**
 * 3. Helpers
 */
function getSelections(temp) {
  const procesos = Array.from(temp.querySelectorAll('.process-selector:checked')).map(el => parseInt(el.value));
  const cocedores = Array.from(temp.querySelectorAll('.cocedor-selector:checked')).map(el => parseInt(el.value));
  return { procesos, cocedores };
}

/**
 * 4. Lógica principal: showProcessModal
 */
export function showProcessModal(procesos = [], cocedores = [], options = {}) {
  return new Promise((resolve) => {
    const {
      title = 'Selección de Procesos',
      selectText = 'Seleccionar',
      cancelText = 'Cancelar',
      allowMultiple = true,
      minSelection = 1
    } = options;
    const modalId = 'ProcessModal-' + Date.now();

    injectProcessModalStyles();

    const modalHtml = processCocedorModalHtml({
      modalId, title, procesos, cocedores, allowMultiple, minSelection, selectText, cancelText
    });
    const temp = document.createElement('div');
    temp.innerHTML = modalHtml;
    document.body.appendChild(temp);

    const modalEl = temp.querySelector(`#${modalId}`);
    const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });

    const confirmBtn = temp.querySelector('#confirmSelection');
    const warningMessage = temp.querySelector('#selectionWarning');
    const cocedoresSection = temp.querySelector('#cocedoresSection');
    const processInputs = temp.querySelectorAll('.process-selector');
    const cocedorInputs = () => temp.querySelectorAll('.cocedor-selector');

    // Mostrar/ocultar cocedores al seleccionar procesos
    function handleProcessChange() {
      const procesosSeleccionados = temp.querySelectorAll('.process-selector:checked').length;
      if (procesosSeleccionados > 0) {
        cocedoresSection.style.display = 'block';
      } else {
        cocedoresSection.style.display = 'none';
        cocedorInputs().forEach(el => { el.checked = false; });
      }
      validateSelection();
    }
    processInputs.forEach(el => el.addEventListener('change', handleProcessChange));

    function validateSelection() {
      const procesosSeleccionados = temp.querySelectorAll('.process-selector:checked').length;
      const cocedoresSeleccionados = cocedoresSection.style.display !== 'none'
        ? cocedorInputs().length && Array.from(cocedorInputs()).some(el => el.checked)
        : false;
      const isValid = procesosSeleccionados >= minSelection && cocedoresSeleccionados;
      confirmBtn.disabled = !isValid;
      warningMessage.style.display = isValid ? 'none' : 'block';
    }
    temp.addEventListener('change', validateSelection);

    confirmBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      resolve(getSelections(temp));
      modal.hide();
    });

    modalEl.addEventListener('hidden.bs.modal', () => {
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
      temp.remove();
    });

    modal.show();
    modalEl.style.display = 'block';
    modalEl.style.paddingTop = '5%';
  });
}

function cocedoresHtml(cocedor) {
  return `
  <div class="col-md-6">
    <div class="cocedor-card-container position-relative">
      <input type="checkbox" class="cocedor-selector visually-hidden" id="cocedor-${cocedor.cocedor_id}" value="${cocedor.cocedor_id}">
      <label for="cocedor-${cocedor.cocedor_id}" class="card shadow-sm d-flex align-items-center p-3 mb-2 cocedor-label">
        <div class="position-absolute top-0 start-0 m-2">
         <div class="cocedor-checkbox" style="width:20px;height:20px;border:1px solid #ccc;border-radius:4px;display:flex;align-items:center;justify-content:center;">
          <i data-lucide="check" style="display:none;"></i>
         </div>
        </div>
        <div class="flex-grow-1 ms-3">
          <span class="fw-semibold d-block cocedor-name">${cocedor.nombre || 'Cocedor'}</span>
          <div class="mt-2">
            ${cocedor.estado ? `<span class="badge ms-2 cocedor-status">${cocedor.estado}</span>` : ''}
          </div>
        </div>
      </label>
    </div>
  </div>`;
}

export function procesarMateriales(materialesStr) {
  if (!materialesStr) return [];

  return materialesStr.split(',').map(material => {
    const partes = material.split(' (');
    return {
      nombre: partes[0],
      cantidad: partes[1].replace(')', '')
    };
  });
}

function procesosHtml(proceso) {
  const materiales = procesarMateriales(proceso.materiales_con_cantidad);
  console.log(materiales);
  const totalMateriales = materiales.length;
  console.log(totalMateriales);

  return `
  <label class="list-group-item d-flex align-items-start py-3 px-3 hover-bg-light position-relative" 
         style="transition: all 0.2s;border-bottom: 1px solid #f8f9fa;cursor: pointer;">
    <input class="form-check-input me-3 process-selector mt-1" 
           type="checkbox" 
           value="${proceso.pro_id}" 
           style="width: 1.1em; height: 1.1em;">
    
    <div class="d-flex flex-column w-100">
      <!-- Primera fila: ID, Peso y Descripción -->
      <div class="d-flex w-100 align-items-center mb-2">
        <div class="w-25 pe-2">
          <span class="badge bg-primary bg-opacity-10 text-primary rounded-1" 
                style="font-size: 0.85rem;padding: 0.35em 0.7em;font-weight: 500;">
            #${proceso.pro_id}
          </span>
        </div>
        
        <div class="w-25 pe-2">
          <span class="text-dark" style="font-size: 0.95rem; font-weight: 500;">
            ${formatter.format(proceso.pro_total_kg || '0')} 
            <small class="text-muted">kg</small>
          </span>
        </div>
        
        <div class="w-50">
          <div class="text-dark" 
               style="font-size: 0.9rem; line-height: 1.3; font-weight: 500;"
               title="${proceso.pt_descripcion || 'Sin descripción'}">
            ${proceso.pt_descripcion || 'Sin descripción'}
          </div>
        </div>
      </div>
      
      <!-- Segunda fila: Materiales -->
      ${totalMateriales > 0 ? `
      <div class="d-flex w-100 align-items-center">
        <div class="w-25 pe-2">
          <small class="text-muted" style="font-size: 0.75rem;">Materiales (${totalMateriales}):</small>
        </div>
        <div class="w-75">
          <div class="d-flex flex-wrap gap-1">
            ${renderMateriales(materiales)}
          </div>
        </div>
      </div>
      ` : `
      <div class="d-flex w-100 align-items-center">
        <div class="w-25 pe-2">
          <small class="text-muted" style="font-size: 0.75rem;">Materiales:</small>
        </div>
        <div class="w-75">
          <span class="text-muted" style="font-size: 0.8rem;">Sin materiales</span>
        </div>
      </div>
      `}
    </div>
  </label>`;
}

// Función helper para renderizar materiales de manera más eficiente
export function renderMateriales(materiales, maxVisible = 5, visible = true) {
  if (!materiales || materiales.length === 0) {
    return '<span class="text-muted" style="font-size: 0.8rem;">Sin materiales</span>';
  }

  const materialesVisibles = materiales.slice(0, maxVisible);
  const materialesOcultos = materiales.length - maxVisible;

  let html = materialesVisibles.map(material => {
    const nombre = material.nombre || 'Material';
    const cantidad = material.cantidad || '0';

    return `
      <span class="badge-modern" 
            data-bs-toggle="tooltip" 
            data-bs-placement="top"
            title="${nombre}: ${cantidad}">
       ${nombre}
       ${visible ? `<small class="opacity-75">(${formatter.format(parseInt(cantidad))} kg)</small>` : ''}
      </span>`;
  }).join('');

  // Si hay más materiales ocultos, mostrar un indicador
  if (materialesOcultos > 0) {
    html += `
      <span class="badge-modern" 
            data-bs-toggle="tooltip" 
            data-bs-placement="top"
            title="Y ${materialesOcultos} materiales más: ${materiales.slice(maxVisible).map(m => m.nombre).join(', ')}">
        +${materialesOcultos}
      </span>`;
  }

  return html;
}

// Modal simple para capturar motivo de mantenimiento
export const showMaintenanceModal = (options = {}) => {
  const {
    title = 'Motivo de mantenimiento',
    label = 'Motivo',
    placeholder = 'Describa el motivo del paro...',
    okText = 'Guardar',
    cancelText = 'Cancelar',
    minLength = 3,
    maxLength = 500
  } = options;

  return new Promise(resolve => {
    const modalId = 'maintModal-' + Date.now();
    const html = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}-label" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="${modalId}-label">
                <i data-lucide="wrench" class="me-2 text-warning"></i>${title}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              <label class="form-label">${label}</label>
              <textarea class="form-control" id="${modalId}-textarea" rows="4" placeholder="${placeholder}" maxlength="${maxLength}"></textarea>
              <div class="d-flex justify-content-between align-items-center mt-1 small text-muted">
                <span>Mínimo ${minLength} caracteres. Máximo ${maxLength}.</span>
                <span id="${modalId}-counter">0 / ${maxLength}</span>
              </div>
              <div class="invalid-feedback d-block mt-2" id="${modalId}-error" style="display:none">Ingrese un motivo válido.</div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${cancelText}</button>
              <button type="button" class="btn btn-primary" id="${modalId}-ok">${okText}</button>
            </div>
          </div>
        </div>
      </div>`;

    const temp = document.createElement('div');
    temp.innerHTML = html;
    document.body.appendChild(temp);

    const modalEl = temp.querySelector('#' + modalId);
    const modal = new bootstrap.Modal(modalEl);
    const txt = temp.querySelector('#' + modalId + '-textarea');
    const okBtn = temp.querySelector('#' + modalId + '-ok');
    const err = temp.querySelector('#' + modalId + '-error');
    const counter = temp.querySelector('#' + modalId + '-counter');

    function validate() {
      const value = (txt.value || '').trim();
      const length = value.length;
      const ok = length >= minLength;
      okBtn.disabled = !ok;
      err.style.display = ok ? 'none' : 'block';
      counter.textContent = `${length} / ${maxLength}`;
      return ok;
    }

    modalEl.addEventListener('shown.bs.modal', () => {
      txt.focus();
      validate();
    });

    txt.addEventListener('input', validate);

    okBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter') okBtn.click(); });
    modalEl.addEventListener('hidden.bs.modal', () => {
      modal.dispose();
      temp.remove();
      if (!okBtn.disabled && (txt.value || '').trim().length >= minLength) return;
      resolve(null);
    });


    okBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!validate()) return;
      const value = txt.value.trim();
      resolve(value);
      modal.hide();
    });

    modalEl.addEventListener('hidden.bs.modal', () => {
      temp.remove();
      if (!okBtn.disabled && (txt.value || '').trim().length >= minLength) return;
      resolve(null);
    });

    modal.show();
  });
};

/**
 * Modal para captura de parámetros en cocedores.
 * Mejora la validación, control de eventos, y mantiene modularidad limpia.
 * - Se cargan y validan campos dinámicos.
 * - Evita escuchas duplicadas y fugas de eventos.
 * - Usa Bootstrap Modal y control DOM basado en ID dinámicos por cocedor.
 */

export async function showCocedorCaptureModal(config = {}) {
  const {
    cocedorId,
    modalId = `cocedor-modal-${cocedorId}`,
    title = "Registro Cocedor",
    icon = "activity",
    size = "xl"
  } = config;

  const user = JSON.parse(localStorage.getItem('usuario') || 'null');
  const operador = user?.usuario_nombre ?? user?.usuario ?? 'Anonimo';

  if (!cocedorId) {
    showToast("No se proporcionó el cocedor.", false);
    return null;
  }

  // §1 Cargar HTML del modal
  if (!document.getElementById(modalId)) {
    const res = await fetch("views/cocedores/registrarHoraXHoraModal.html");
    const modalHtml = (await res.text())
      .replace(/\$\{modalId\}/g, modalId)
      .replace(/\$\{title\}/g, title)
      .replace(/\$\{icon\}/g, icon)
      .replace(/\$\{size\}/g, size);

    const wrapper = document.createElement("div");
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper.firstElementChild);
  }

  const modalElement = document.getElementById(modalId);
  const modal = new bootstrap.Modal(modalElement, {
    backdrop: "static",
    keyboard: false
  });

  // §2 Validar campos
  const camposValidar = [
    { id: 'ph', min: 3.0, max: 3.8, nombre: 'pH' },
    { id: 'ntu', min: 60, max: 600, nombre: 'NTU' },
    { id: 'solidos', min: 1.5, max: 2.8, nombre: '% Sólidos' },
    { id: 'carga-cuero', min: 1, max: 20000, nombre: 'Carga de cuero' }
  ];


  const limpiarInput = (input, error) => {
    input.classList.remove('cocedor-form-control-invalid');
    if (error) error.textContent = "";
  };

  const enlazarValidaciones = () => {
    document.getElementById(`${modalId}-carga-cuero`).focus();
    camposValidar.forEach(campo => {
      const input = document.getElementById(`${modalId}-${campo.id}`);
      const error = document.getElementById(`${modalId}-${campo.id}-error`);
      if (!input || input.__bound) return;

      const validate = () => validarInputNumerico(input, error, campo);
      const debounced = debounce(validate, 300);

      input.addEventListener('input', debounced);
      input.addEventListener('blur', validate);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') validate();
      });
      input.addEventListener('input', () => limpiarInput(input, error));

      input.__bound = true;
    });
  };

  modalElement.addEventListener("shown.bs.modal", enlazarValidaciones, { once: true });

  // §3 Precargar valores por defecto
  const now = new Date();
  const fechaHora = getLocalDateTimeString(now);
  document.getElementById(`${modalId}-fecha`).value = fechaHora;
  const datos = await obtenerCocedoresProcesoById(cocedorId);
  const flujos = await obtenerFlujos();
  const temperatura = await obtenerTemperaturaCocedores();

  if (!datos || !flujos || !temperatura) {
    showToast("Datos del cocedor incompletos.", false);
    return null;
  }

  const { agrupacion, relacion_id, cocedor } = datos;
  const flujo = flujos[0][`Flujo_cocedor_${cocedorId}`];
  const { COCEDORES_TEMPERATURA_DE_ENTRADA, COCEDORES_TEMPERATURA_DE_SALIDA } = temperatura;

  const setValor = (id, valor) => document.getElementById(`${modalId}-${id}`).value = valor;
  setValor('cocedor', `${cocedor}, ${agrupacion}`);
  setValor('relacion-id', relacion_id);
  setValor('operador', operador);
  setValor('flujo', flujo);
  setValor('temp-entrada', COCEDORES_TEMPERATURA_DE_ENTRADA);
  setValor('temp-salida', COCEDORES_TEMPERATURA_DE_SALIDA);

  // Validar temperatura y flujo
  const flujoConfig = {
    Flujo_cocedor_1: [140, 170],
    Flujo_cocedor_2: [140, 170],
    Flujo_cocedor_3: [140, 170],
    Flujo_cocedor_4: [140, 170],
    Flujo_cocedor_5: [140, 170],
    Flujo_cocedor_6: [150, 190],
    Flujo_cocedor_7: [150, 190],
  };
  const [minF, maxF] = flujoConfig[`Flujo_cocedor_${cocedorId}`] || [0, 9999];
  const flujoInput = document.getElementById(`${modalId}-flujo`);
  flujoInput.classList.toggle('cocedor-form-control-invalid', !(flujo >= minF && flujo <= maxF));

  document.getElementById(`${modalId}-temp-entrada`).classList.toggle('cocedor-form-control-invalid', !(COCEDORES_TEMPERATURA_DE_ENTRADA > 56 && COCEDORES_TEMPERATURA_DE_ENTRADA < 70));
  document.getElementById(`${modalId}-temp-salida`).classList.toggle('cocedor-form-control-invalid', !(COCEDORES_TEMPERATURA_DE_SALIDA > 55 && COCEDORES_TEMPERATURA_DE_SALIDA < 60));

  // §4 Mostrar modal y resolver promesa
  modal.show();
  return new Promise((resolve) => {
    const btnConfirm = document.getElementById(`${modalId}-confirm`);
    const btnCancel = document.getElementById(`${modalId}-cancel`);

    const onConfirm = () => {
      const camposInvalidos = modalElement.querySelectorAll('.cocedor-form-control-invalid, .cocedor-form-control-alerta');

      const camposInvalidosArray = {};
      const facts = [];
      facts.push({
        titulo: "Cocedor:",
        valor: cocedor
      });

      /* const payload = {
        titulo: "🚨 Enviado desde El sistema con endpoint de php",
        fecha: "2025-08-26 10:45",
        facts: [
          { titulo: "Cocedor", valor: "Cocedor 3" },
          { titulo: "Parámetro", valor: "Temperatura" },
          { titulo: "Valor", valor: "95°C" },
          { titulo: "Rango", valor: "85°C - 90°C" },
          { titulo: "Responsable", valor: "Juan Pérez" }
        ]
      }; */

      camposInvalidos.forEach(input => {
        const nombre = input.id?.split('-')[3];
        const valor = input.value;
        camposInvalidosArray[nombre] = valor;

        const campo = camposValidar.find(c => c.id === nombre);
        if (campo) {
          facts.push({
            titulo: '📊 Parámetro:',
            valor: campo.nombre,
          });
          facts.push({
            titulo: '📈 Valor detectado:',
            valor: valor,
          });
          facts.push({
            titulo: '✅ Rango permitido:',
            valor: `${campo.min} - ${campo.max}`,
          });
        }
      });
      
      facts.push({
        titulo: "👤 Responsable de registro:",
        valor: operador
      });      

      const payload = {
        titulo: "🚨 Parámetros fuera o cerca del rango permitido",
        fecha: new Date().toLocaleString('sv-SE'), // formato: 2025-08-26 15:30:45
        facts: facts
      };
      console.log(camposInvalidosArray);
      if (Object.keys(camposInvalidosArray).length > 0) {
        alerta(payload);
      }

      const getRadio = (name) => document.querySelector(`input[name="${modalId}-${name}"]:checked`)?.value || "";
      const getVal = (id) => document.getElementById(`${modalId}-${id}`)?.value || "";

      const data = {
        cocedor: getVal("cocedor"),
        relacion_id: getVal("relacion-id"),
        fecha: getVal("fecha"),
        operador: getVal("operador"),
        flujo: getVal("flujo"),
        tempEntrada: getVal("temp-entrada"),
        tempSalida: getVal("temp-salida"),
        cargaCuero: getVal("carga-cuero"),
        ph: getVal("ph"),
        ntu: getVal("ntu"),
        solidos: getVal("solidos"),
        muestra: getRadio("muestra"),
        agitacion: getRadio("agitacion"),
        desengrasador: getRadio("desengrasador"),
        modo: getRadio("modo"),
        observaciones: getVal("observaciones") || "N/A"
      };

      if (data.muestra === "no" || data.agitacion === "off" || data.desengrasador === "off") {
        showToast("Verifica muestra, agitación y desengrasador.", false);
        return;
      }

      modal.hide();
      resolve(data);
    };

    const onCancel = () => resolve(null);

    btnConfirm.addEventListener("click", onConfirm, { once: true });
    btnCancel.addEventListener("click", onCancel, { once: true });
  });
}


export async function showCocedorValidateModal(config = {}) {
  const {
    cocedorId,
    modalId = `cocedor-modal-${cocedorId}`,
    title = "Validar registro",
    icon = "activity",
    size = "xl"
  } = config;

  const user = JSON.parse(localStorage.getItem('usuario') || 'null');
  const supervisor = user?.usuario_nombre ?? user?.usuario ?? 'Anonimo';

  if (!cocedorId) {
    showToast("No se proporcionó el cocedor.", false);
    return null;
  }

  try {
    const res = await fetch("views/cocedores/validarHoraXHoraModal.html");
    if (!res.ok) throw new Error(`Failed to load modal HTML: ${res.status}`);

    let modalHtml = await res.text();
    modalHtml = modalHtml
      .replace(/\$\{modalId\}/g, modalId)
      .replace(/\$\{title\}/g, title)
      .replace(/\$\{icon\}/g, icon)
      .replace(/\$\{size\}/g, size);

    const existingModal = document.getElementById(modalId);
    if (existingModal) existingModal.remove();

    const wrapper = document.createElement("div");
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper.firstElementChild);

    const modalElement = document.getElementById(modalId);
    const btnConfirm = modalElement.querySelector('.btn-confirm');
    const btnCancel = modalElement.querySelector('.btn-cancel');
    const modal = new bootstrap.Modal(modalElement, { backdrop: "static", keyboard: false });

    const VALIDATION_RANGES = {
      flujo: {
        Flujo_cocedor_1: { min: 140, max: 170, nombre: 'Flujo cocedor 1' },
        Flujo_cocedor_2: { min: 140, max: 170, nombre: 'Flujo cocedor 2' },
        Flujo_cocedor_3: { min: 140, max: 170, nombre: 'Flujo cocedor 3' },
        Flujo_cocedor_4: { min: 140, max: 170, nombre: 'Flujo cocedor 4' },
        Flujo_cocedor_5: { min: 140, max: 170, nombre: 'Flujo cocedor 5' },
        Flujo_cocedor_6: { min: 150, max: 190, nombre: 'Flujo cocedor 6' },
        Flujo_cocedor_7: { min: 150, max: 190, nombre: 'Flujo cocedor 7' }
      },
      tempEntrada: { min: 56, max: 70, nombre: 'T° entrada' },
      tempSalida: { min: 55, max: 60, nombre: 'T° salida' },
      ph: { min: 3.0, max: 3.8, nombre: 'pH' },
      ntu: { min: 60, max: 600, nombre: 'NTU' },
      solidos: { min: 1.5, max: 2.8, nombre: '% Sólidos' },
      cargaCuero: { min: 1, max: 20000, nombre: 'Carga de cuero' }
    };

    function getModalElements() {
      const fields = ['flujo', 'temp-entrada', 'temp-salida', 'carga-cuero', 'solidos', 'ph', 'ntu'];
      const base = Object.fromEntries(
        fields.flatMap(name => {
          const camelName = camel(name);
          return [
            [`input${camelName}`, document.getElementById(`${modalId}-${name}`)],
            [`inputError${camelName}`, document.getElementById(`${modalId}-${name}-error`)]
          ];
        })
      );

      return {
        ...base,
        inputObservaciones: document.getElementById(`${modalId}-observaciones`),
        observacionesSuper: document.getElementById(`comentarios-validacion`),
        inputFecha: document.getElementById(`${modalId}-fecha`),
        inputOperador: document.getElementById(`${modalId}-operador`),
        inputCocedor: document.getElementById(`${modalId}-cocedor`),
        inputRelacionId: document.getElementById(`${modalId}-relacion-id`),
        indicatorStatus: document.getElementById(`status-indicator`),
        indicatorStatusText: document.getElementById(`status-indicator-text`),
        inputValidadoPor: document.getElementById(`${modalId}-validado-por`)
      };
    }

    function validateAll({ cocedorType, ...elements }) {
      console.log(cocedorType);
      console.log(VALIDATION_RANGES.flujo[cocedorType]);
      return [
        validarInputNumerico(elements.inputTempEntrada, elements.inputErrorTempEntrada, VALIDATION_RANGES.tempEntrada),
        validarInputNumerico(elements.inputTempSalida, elements.inputErrorTempSalida, VALIDATION_RANGES.tempSalida),
        validarInputNumerico(elements.inputFlujo, elements.inputErrorFlujo, VALIDATION_RANGES.flujo[cocedorType] || VALIDATION_RANGES.flujo.Flujo_cocedor_1),
        validarInputNumerico(elements.inputPH, elements.inputErrorPH, VALIDATION_RANGES.ph),
        validarInputNumerico(elements.inputNTU, elements.inputErrorNTU, VALIDATION_RANGES.ntu),
        validarInputNumerico(elements.inputSolidos, elements.inputErrorSolidos, VALIDATION_RANGES.solidos),
        validarInputNumerico(elements.inputCargaCuero, elements.inputErrorCargaCuero, VALIDATION_RANGES.cargaCuero)
      ].every(Boolean);
    }

    modalElement.addEventListener("shown.bs.modal", async () => {
      const detalle = await obtenerDetelleCocedorProceso(cocedorId);
      const el = getModalElements();
      if (!detalle) return modal.hide(), showToast("Error al cargar los detalles del cocedor.", false);
      const cocedorSeleccionado = `${detalle.cocedor}, ${detalle.agrupacion}`;
      if (Number(detalle.supervisor_validado) === 0) {
        el.indicatorStatusText.textContent = 'Pendiente de validación';
      } else {
        el.indicatorStatusText.textContent = 'Validado';
      }
      el.inputFecha.value = detalle.fecha_hora;
      el.inputOperador.value = detalle.responsable;
      el.inputCocedor.value = cocedorSeleccionado;
      el.inputRelacionId.value = detalle.detalle_id;
      el.inputFlujo.value = detalle.param_agua;
      el.inputTempEntrada.value = detalle.param_temp_entrada;
      el.inputTempSalida.value = detalle.param_temp_salida;
      el.inputCargaCuero.value = detalle.peso_consumido;
      el.inputSolidos.value = detalle.param_solidos;
      el.inputPh.value = detalle.param_ph;
      el.inputNtu.value = detalle.param_ntu;
      el.inputObservaciones.value = detalle.observaciones || '';
      el.inputValidadoPor.value = supervisor;

      if (detalle.supervisor_validado === '1') {
        el.indicatorStatus?.classList.replace('status-pending', 'status-validado');
        el.indicatorStatusText.textContent = 'Validado';
      }
      validateAll({ cocedorType: `Flujo_cocedor_${cocedorId}` || 'Flujo_cocedor_1', ...el });
    }, { once: true });

    modal.show();

    return new Promise(resolve => {
      const confirm = () => {
        console.log('confirm');
        const el = getModalElements();
        if (!el.observacionesSuper?.value) return showToast("Debe ingresar comentarios de validación.", 'warning');

        const data = {
          cocedor: cocedorId,
          relacion_id: el.inputRelacionId?.value,
          observaciones: el.observacionesSuper?.value || "N/A"
        };

        cleanup();
        modal.hide();
        resolve(data);
      };

      const cancel = () => cleanup() || resolve(null);

      btnConfirm?.addEventListener("click", confirm);
      btnCancel?.addEventListener("click", cancel);

      function cleanup() {
        btnConfirm?.removeEventListener("click", confirm);
        btnCancel?.removeEventListener("click", cancel);
      }

    });
  } catch (err) {
    console.error('Error in showCocedorValidateModal:', err);
    showToast("Error al cargar el modal de validación.", false);
    return null;
  }
}

function camel(str) {
  return str.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase());
}

