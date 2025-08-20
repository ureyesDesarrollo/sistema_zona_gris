import { obtenerCocedoresProcesoById, obtenerDetelleCocedorProceso, obtenerFlujos, obtenerTemperaturaCocedores } from "../services/cocedores.service.js";
import { debounce } from "../utils/debounce.js";
import { formatter } from "../utils/formatter.js";
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

  // 1) Cargar HTML del modal (solo una vez)
  let res = await fetch("views/cocedores/registrarHoraXHoraModal.html");
  let modalHtml = await res.text();

  modalHtml = modalHtml
    .replace(/\$\{modalId\}/g, modalId)
    .replace(/\$\{title\}/g, title)
    .replace(/\$\{icon\}/g, icon)
    .replace(/\$\{size\}/g, size);

  if (!document.getElementById(modalId)) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper.firstElementChild);
  }

  const modalElement = document.getElementById(modalId);

  // Instanciar modal Bootstrap
  const modal = new bootstrap.Modal(modalElement, {
    backdrop: "static",
    keyboard: false
  });

  // ⚠️ Solo después de que el modal esté en el DOM y visible, buscamos inputs y unimos listeners
  modalElement.addEventListener("shown.bs.modal", () => {
    const inputPH = document.getElementById(`${modalId}-ph`);
    const inputNTU = document.getElementById(`${modalId}-ntu`);
    const inputSolidos = document.getElementById(`${modalId}-solidos`);
    const inputErrorPH = document.getElementById(`${modalId}-ph-error`);
    const inputErrorNTU = document.getElementById(`${modalId}-ntu-error`);
    const inputErrorSolidos = document.getElementById(`${modalId}-solidos-error`);
    const inputCargaCuero = document.getElementById(`${modalId}-carga-cuero`);
    const inputErrorCargaCuero = document.getElementById(`${modalId}-carga-cuero-error`);

    if (!inputPH || !inputNTU || !inputSolidos || !inputCargaCuero) return;

    inputCargaCuero.focus();

    // ===== Carga de cuero =====
    if (!inputCargaCuero.__bound) {
      inputCargaCuero.__bound = true;

      const validateCargaCuero = () => validarInputNumerico(inputCargaCuero, inputErrorCargaCuero, { min: 1, max: 20000, nombre: "Carga de cuero" });
      const onCargaCueroKeydown = (e) => { if (e.key === 'Enter') validateCargaCuero(); };
      const debouncedCargaCuero = debounce(validateCargaCuero, 350);

      inputCargaCuero.addEventListener('input', debouncedCargaCuero);
      inputCargaCuero.addEventListener('blur', validateCargaCuero);
      inputCargaCuero.addEventListener('keydown', onCargaCueroKeydown);

      inputCargaCuero.__debounced = debouncedCargaCuero;
      inputCargaCuero.__onBlur = validateCargaCuero;
      inputCargaCuero.__onKeydown = onCargaCueroKeydown;

      inputCargaCuero.addEventListener('input', () => {
        inputCargaCuero.classList.remove('cocedor-form-control-invalid');
        if (inputErrorCargaCuero) inputErrorCargaCuero.textContent = "";
      });
    }
    // ===== pH =====
    if (!inputPH.__bound) {
      inputPH.__bound = true;

      const validatePH = () => validarInputNumerico(inputPH, inputErrorPH, { min: 3.0, max: 3.8, nombre: "pH" });
      const onPHKeydown = (e) => { if (e.key === 'Enter') validatePH(); };
      const debouncedPH = debounce(validatePH, 350);

      inputPH.addEventListener('input', debouncedPH);
      inputPH.addEventListener('blur', validatePH);
      inputPH.addEventListener('keydown', onPHKeydown);

      inputPH.__debounced = debouncedPH;
      inputPH.__onBlur = validatePH;
      inputPH.__onKeydown = onPHKeydown;

      inputPH.addEventListener('input', () => {
        inputPH.classList.remove('cocedor-form-control-invalid');
        if (inputErrorPH) inputErrorPH.textContent = "";
      });
    }

    // ===== NTU =====
    if (!inputNTU.__bound) {
      inputNTU.__bound = true;

      const validateNTU = () => validarInputNumerico(inputNTU, inputErrorNTU, { min: 60, max: 600, nombre: "NTU" });
      const onNTUKeydown = (e) => { if (e.key === 'Enter') validateNTU(); };
      const debouncedNTU = debounce(validateNTU, 350);

      inputNTU.addEventListener('input', debouncedNTU);
      inputNTU.addEventListener('blur', validateNTU);
      inputNTU.addEventListener('keydown', onNTUKeydown);

      inputNTU.__debounced = debouncedNTU;
      inputNTU.__onBlur = validateNTU;
      inputNTU.__onKeydown = onNTUKeydown;

      inputNTU.addEventListener('input', () => {
        inputNTU.classList.remove('cocedor-form-control-invalid');
        if (inputErrorNTU) inputErrorNTU.textContent = "";
      });
    }

    // ===== % Sólidos =====
    if (!inputSolidos.__bound) {
      inputSolidos.__bound = true;

      const validateSolidos = () => validarInputNumerico(inputSolidos, inputErrorSolidos, { min: 1.5, max: 2.8, nombre: "% Sólidos" });
      const onSolKeydown = (e) => { if (e.key === 'Enter') validateSolidos(); };
      const debouncedSolidos = debounce(validateSolidos, 350);

      inputSolidos.addEventListener('input', debouncedSolidos);
      inputSolidos.addEventListener('blur', validateSolidos);
      inputSolidos.addEventListener('keydown', onSolKeydown);

      inputSolidos.__debounced = debouncedSolidos;
      inputSolidos.__onBlur = validateSolidos;
      inputSolidos.__onKeydown = onSolKeydown;

      inputSolidos.addEventListener('input', () => {
        inputSolidos.classList.remove('cocedor-form-control-invalid');
        if (inputErrorSolidos) inputErrorSolidos.textContent = "";
      });
    }
  }, { once: true });


  // ------ Inicialización de valores por defecto ------
  const now = new Date();
  const fecha = now.toISOString().split("T")[0];
  const hora = now.toTimeString().split(" ")[0].slice(0, 5);
  const fechaHora = `${fecha} ${hora}`;

  const inputFecha = document.getElementById(`${modalId}-fecha`);
  if (inputFecha) inputFecha.value = fechaHora;

  const datosCocedor = await obtenerCocedoresProcesoById(cocedorId);
  if (!datosCocedor) {
    showToast("No se encontraron datos del cocedor.", false);
    return null;
  }

  const flujos = await obtenerFlujos();
  if (!flujos) {
    showToast("No se encontraron flujos.", false);
    return null;
  }

  const { agrupacion, relacion_id, cocedor } = datosCocedor;
  const cocedorSeleccionado = `${cocedor}, ${agrupacion}`;
  const flujoSeleccionado = `Flujo_cocedor_${cocedorId}`;
  const flujo = flujos[0][flujoSeleccionado];

  const temperatura = await obtenerTemperaturaCocedores();
  const { COCEDORES_TEMPERATURA_DE_ENTRADA, COCEDORES_TEMPERATURA_DE_SALIDA } = temperatura;

  document.getElementById(`${modalId}-cocedor`).value = cocedorSeleccionado;
  document.getElementById(`${modalId}-relacion-id`).value = relacion_id;
  document.getElementById(`${modalId}-operador`).value = operador;
  document.getElementById(`${modalId}-flujo`).value = flujo;
  document.getElementById(`${modalId}-temp-entrada`).value = COCEDORES_TEMPERATURA_DE_ENTRADA;
  document.getElementById(`${modalId}-temp-salida`).value = COCEDORES_TEMPERATURA_DE_SALIDA;

  if (COCEDORES_TEMPERATURA_DE_ENTRADA <= 56 || COCEDORES_TEMPERATURA_DE_ENTRADA >= 70) {
    document.getElementById(`${modalId}-temp-entrada`).classList.add('cocedor-form-control-invalid');
  }
  if (COCEDORES_TEMPERATURA_DE_SALIDA <= 55 || COCEDORES_TEMPERATURA_DE_SALIDA >= 60) {
    document.getElementById(`${modalId}-temp-salida`).classList.add('cocedor-form-control-invalid');
  }

  const validFlujo = {
    Flujo_cocedor_1: { min: 140, max: 170 },
    Flujo_cocedor_2: { min: 140, max: 170 },
    Flujo_cocedor_3: { min: 140, max: 170 },
    Flujo_cocedor_4: { min: 140, max: 170 },
    Flujo_cocedor_5: { min: 140, max: 170 },
    Flujo_cocedor_6: { min: 150, max: 190 },
    Flujo_cocedor_7: { min: 150, max: 190 }
  };

  console.log(flujoSeleccionado);

  const validFlujoCocedor = validFlujo[flujoSeleccionado];
  if (flujo >= validFlujoCocedor.min && flujo <= validFlujoCocedor.max) {
    document.getElementById(`${modalId}-flujo`).classList.remove('cocedor-form-control-invalid');
  } else {
    document.getElementById(`${modalId}-flujo`).classList.add('cocedor-form-control-invalid');
  }

  const btnConfirm = document.getElementById(`${modalId}-confirm`);
  const btnCancel = document.getElementById(`${modalId}-cancel`);

  modal.show();

  // 2) Envolver en una Promesa y resolver al confirmar / cerrar
  return new Promise((resolve) => {
    const onConfirm = () => {
      const inputPH = document.getElementById(`${modalId}-ph`);
      const inputNTU = document.getElementById(`${modalId}-ntu`);
      const inputSolidos = document.getElementById(`${modalId}-solidos`);
      const inputErrorPH = document.getElementById(`${modalId}-ph-error`);
      const inputErrorNTU = document.getElementById(`${modalId}-ntu-error`);
      const inputErrorSolidos = document.getElementById(`${modalId}-solidos-error`);
      const inputCargaCuero = document.getElementById(`${modalId}-carga-cuero`);
      const inputErrorCargaCuero = document.getElementById(`${modalId}-carga-cuero-error`);
      const data = {
        cocedor: cocedorSeleccionado,
        relacion_id: relacion_id,
        fecha: document.getElementById(`${modalId}-fecha`)?.value || "",
        operador: document.getElementById(`${modalId}-operador`)?.value || "",
        flujo: document.getElementById(`${modalId}-flujo`)?.value || "",
        tempEntrada: document.getElementById(`${modalId}-temp-entrada`)?.value || "",
        tempSalida: document.getElementById(`${modalId}-temp-salida`)?.value || "",
        cargaCuero: document.getElementById(`${modalId}-carga-cuero`)?.value || "",
        ph: inputPH?.value || "",
        ntu: inputNTU?.value || "",
        solidos: inputSolidos?.value || "",             // <<<<< nuevo campo
        muestra: document.querySelector(`input[name="${modalId}-muestra"]:checked`)?.value || "",
        agitacion: document.querySelector(`input[name="${modalId}-agitacion"]:checked`)?.value || "",
        desengrasador: document.querySelector(`input[name="${modalId}-desengrasador"]:checked`)?.value || "",
        modo: document.querySelector(`input[name="${modalId}-modo"]:checked`)?.value || "",
        observaciones: document.getElementById(`${modalId}-observaciones`)?.value || "N/A"
      };
      if (data.muestra === "no") {
        showToast("Debe tomar una muestra.", false);
        return;
      }
      if (data.agitacion === "off") {
        showToast("Debe activar la agitación.", false);
        return;
      }
      if (data.desengrasador === "off") {
        showToast("Debe activar el desengrasador.", false);
        return;
      }

      validarInputNumerico(inputPH, inputErrorPH, { min: 3.0, max: 3.8, nombre: "pH" });
      validarInputNumerico(inputNTU, inputErrorNTU, { min: 60, max: 600, nombre: "NTU" });
      validarInputNumerico(inputSolidos, inputErrorSolidos, { min: 1.5, max: 2.8, nombre: "% Sólidos" });
      validarInputNumerico(inputCargaCuero, inputErrorCargaCuero, { min: 1, max: 20000, nombre: "Carga de cuero" });

      cleanup();
      modal.hide();
      resolve(data);
    };

    const onCancelOrHide = () => {
      cleanup();
      resolve(null);
    };

    btnConfirm?.addEventListener("click", onConfirm, { once: true });
    btnCancel?.addEventListener("click", onCancelOrHide, { once: true });
    modalElement.addEventListener("hidden.bs.modal", onCancelOrHide, { once: true });

    function cleanupField(input) {
      if (!input) return;
      if (input.__debounced) input.removeEventListener('input', input.__debounced);
      if (input.__onBlur) input.removeEventListener('blur', input.__onBlur);
      if (input.__onKeydown) input.removeEventListener('keydown', input.__onKeydown);
      input.__debounced = null;
      input.__onBlur = null;
      input.__onKeydown = null;
      input.__bound = false;
    }


    function cleanup() {
      btnConfirm?.removeEventListener("click", onConfirm);
      btnCancel?.removeEventListener("click", onCancelOrHide);
      modalElement.removeEventListener("hidden.bs.modal", onCancelOrHide);
      const inputPH = document.getElementById(`${modalId}-ph`);
      const inputNTU = document.getElementById(`${modalId}-ntu`);
      const inputSolidos = document.getElementById(`${modalId}-solidos`);
      const inputCargaCuero = document.getElementById(`${modalId}-carga-cuero`);
      cleanupField(inputPH);
      cleanupField(inputNTU);
      cleanupField(inputSolidos);
      cleanupField(inputCargaCuero);
    }
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
    // 1) Cargar HTML del modal (solo una vez)
    const res = await fetch("views/cocedores/validarHoraXHoraModal.html");
    if (!res.ok) {
      throw new Error(`Failed to load modal HTML: ${res.status}`);
    }

    let modalHtml = await res.text();

    modalHtml = modalHtml
      .replace(/\$\{modalId\}/g, modalId)
      .replace(/\$\{title\}/g, title)
      .replace(/\$\{icon\}/g, icon)
      .replace(/\$\{size\}/g, size);

    // Remove existing modal if it exists to prevent duplicates
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
      existingModal.remove();
    }

    const wrapper = document.createElement("div");
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper.firstElementChild);

    const modalElement = document.getElementById(modalId);
    const btnConfirm = modalElement.querySelector('.btn-confirm');
    const btnCancel = modalElement.querySelector('.btn-cancel');

    // Instanciar modal Bootstrap
    const modal = new bootstrap.Modal(modalElement, {
      backdrop: "static",
      keyboard: false
    });

    // Validation ranges configuration
    const VALIDATION_RANGES = {
      flujo: {
        Flujo_cocedor_1: { min: 140, max: 170 },
        Flujo_cocedor_2: { min: 140, max: 170 },
        Flujo_cocedor_3: { min: 140, max: 170 },
        Flujo_cocedor_4: { min: 140, max: 170 },
        Flujo_cocedor_5: { min: 140, max: 170 },
        Flujo_cocedor_6: { min: 150, max: 190 },
        Flujo_cocedor_7: { min: 150, max: 190 }
      },
      tempEntrada: { min: 56, max: 70 },
      tempSalida: { min: 55, max: 60 },
      ph: { min: 3.0, max: 3.8 },
      ntu: { min: 60, max: 600 },
      solidos: { min: 1.5, max: 2.8 },
      cargaCuero: { min: 1, max: 20000 }
    };

    function getModalElements() {
      return {
        inputFlujo: document.getElementById(`${modalId}-flujo`),
        inputErrorFlujo: document.getElementById(`${modalId}-flujo-error`),
        inputTempEntrada: document.getElementById(`${modalId}-temp-entrada`),
        inputErrorTempEntrada: document.getElementById(`${modalId}-temp-entrada-error`),
        inputTempSalida: document.getElementById(`${modalId}-temp-salida`),
        inputErrorTempSalida: document.getElementById(`${modalId}-temp-salida-error`),
        inputCargaCuero: document.getElementById(`${modalId}-carga-cuero`),
        inputErrorCargaCuero: document.getElementById(`${modalId}-carga-cuero-error`),
        inputSolidos: document.getElementById(`${modalId}-solidos`),
        inputErrorSolidos: document.getElementById(`${modalId}-solidos-error`),
        inputPH: document.getElementById(`${modalId}-ph`),
        inputErrorPH: document.getElementById(`${modalId}-ph-error`),
        inputNTU: document.getElementById(`${modalId}-ntu`),
        inputErrorNTU: document.getElementById(`${modalId}-ntu-error`),
        observaciones: document.getElementById(`comentarios-validacion`),
        inputFecha: document.getElementById(`${modalId}-fecha`),
        inputOperador: document.getElementById(`${modalId}-operador`),
        inputCocedor: document.getElementById(`${modalId}-cocedor`),
        inputRelacionId: document.getElementById(`${modalId}-relacion-id`),
        indicatorStatus: document.getElementById(`status-indicator`),
        indicatorStatusText: document.getElementById(`status-indicator-text`),
        inputValidadoPor: document.getElementById(`${modalId}-validado-por`)
      };
    }

    function validateField(input, errorElement, range, fieldName, cocedorType = null) {
      if (!input || !errorElement) return false;

      const value = parseFloat(input.value);
      let validRange = range;

      // Special handling for flujo validation
      if (fieldName === 'flujo' && cocedorType) {
        validRange = range[cocedorType] || range.Flujo_cocedor_1;
      }

      if (isNaN(value) || value < validRange.min || value > validRange.max) {
        input.classList.add('cocedor-form-control-invalid');
        errorElement.textContent = `El valor debe estar entre ${validRange.min} y ${validRange.max}. Ajuste el cocedor.`;
        return false;
      } else {
        input.classList.remove('cocedor-form-control-invalid');
        errorElement.textContent = "";
        return true;
      }
    }

    function validateAllFields(elements, cocedorType) {
      const validations = [
        validateField(elements.inputTempEntrada, elements.inputErrorTempEntrada, VALIDATION_RANGES.tempEntrada, 'tempEntrada'),
        validateField(elements.inputTempSalida, elements.inputErrorTempSalida, VALIDATION_RANGES.tempSalida, 'tempSalida'),
        validateField(elements.inputFlujo, elements.inputErrorFlujo, VALIDATION_RANGES.flujo, 'flujo', cocedorType),
        validateField(elements.inputPH, elements.inputErrorPH, VALIDATION_RANGES.ph, 'ph'),
        validateField(elements.inputNTU, elements.inputErrorNTU, VALIDATION_RANGES.ntu, 'ntu'),
        validateField(elements.inputSolidos, elements.inputErrorSolidos, VALIDATION_RANGES.solidos, 'solidos'),
        validateField(elements.inputCargaCuero, elements.inputErrorCargaCuero, VALIDATION_RANGES.cargaCuero, 'cargaCuero')
      ];

      return validations.every(valid => valid);
    }

    modalElement.addEventListener("shown.bs.modal", async () => {
      try {
        const detalle = await obtenerDetelleCocedorProceso(cocedorId);
        const elements = getModalElements();

        if (!detalle) {
          showToast("Error al cargar los detalles del cocedor.", false);
          modal.hide();
          return;
        }
        const { agrupacion, relacion_id, cocedor } = detalle;
        console.log(detalle);
        const cocedorSeleccionado = `${cocedor}, ${agrupacion}`;
        if (elements.indicatorStatus) elements.indicatorStatus.classList.add('status-pending');
        if (elements.indicatorStatusText) elements.indicatorStatusText.textContent = 'Pendiente de validación';

        if (detalle?.supervisor_validado === '1') {
          if (elements.indicatorStatus) elements.indicatorStatus.classList.remove('status-pending');
          if (elements.indicatorStatus) elements.indicatorStatus.classList.add('status-validado');
          if (elements.indicatorStatusText) elements.indicatorStatusText.textContent = 'Validado';
        }
        if (elements.inputFecha) elements.inputFecha.value = detalle?.fecha_hora || '';
        if (elements.inputOperador) elements.inputOperador.value = detalle?.responsable || '';
        if (elements.inputCocedor) elements.inputCocedor.value = cocedorSeleccionado;
        if (elements.inputRelacionId) elements.inputRelacionId.value = relacion_id;
        if (elements.inputFlujo) elements.inputFlujo.value = detalle?.param_agua || '';
        if (elements.inputTempEntrada) elements.inputTempEntrada.value = detalle?.param_temp_entrada || '';
        if (elements.inputTempSalida) elements.inputTempSalida.value = detalle?.param_temp_salida || '';
        if (elements.inputCargaCuero) elements.inputCargaCuero.value = detalle?.peso_consumido || '';
        if (elements.inputSolidos) elements.inputSolidos.value = detalle?.param_solidos || '';
        if (elements.inputPH) elements.inputPH.value = detalle?.param_ph || '';
        if (elements.inputNTU) elements.inputNTU.value = detalle?.param_ntu || '';
        if (elements.observaciones) elements.observaciones.value = detalle?.observaciones || '';
        if (elements.inputValidadoPor) elements.inputValidadoPor.value = supervisor || '';

        const cocedorType = config.cocedorType || 'Flujo_cocedor_1';
        validateAllFields(elements, cocedorType);

      } catch (error) {
        console.error('Error loading cocedor details:', error);
        showToast("Error al cargar los detalles del cocedor.", false);
        modal.hide();
      }

    }, { once: true });

    modal.show();

    // 2) Return Promise that resolves on confirm/cancel
    return new Promise((resolve) => {

      const onConfirm = () => {
        const elements = getModalElements();
        const comentariosValidacion = document.getElementById(`comentarios-validacion`);
        if (!comentariosValidacion.value) {
          showToast("Debe ingresar comentarios de validación.", false);
          return;
        }

        const data = {
          cocedor: elements.cocedorSeleccionado || cocedorId, 
          relacion_id: elements.inputRelacionId.value,
          observaciones: comentariosValidacion.value || "N/A"
        };

        cleanup();
        modal.hide();
        resolve(data);
      };

      const onCancelOrHide = () => {
        cleanup();
        resolve(null);
      };

      // Add event listeners
      btnConfirm?.addEventListener("click", onConfirm, { once: true });
      btnCancel?.addEventListener("click", onCancelOrHide, { once: true });
      modalElement.addEventListener("hidden.bs.modal", onCancelOrHide, { once: true });

      function cleanupField(input) {
        if (!input) return;
        // Remove any existing event listeners
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
      }

      function cleanup() {
        btnConfirm?.removeEventListener("click", onConfirm);
        btnCancel?.removeEventListener("click", onCancelOrHide);
        modalElement.removeEventListener("hidden.bs.modal", onCancelOrHide);

        const elements = getModalElements();
        Object.values(elements).forEach(element => {
          if (element && element.tagName === 'INPUT') {
            cleanupField(element);
          }
        });
      }
    });

  } catch (error) {
    console.error('Error in showCocedorValidateModal:', error);
    showToast("Error al cargar el modal de validación.", false);
    return null;
  }
}
