import { createModal } from "../../../components/modals/modal.factory.js";
import { formatter } from "../../../utils/formatter.js";

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
              ${procesos.data.map(proceso => procesosHtml(proceso)).join('') || 'No hay procesos disponibles'}
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
          <button type="button" class="btn btn-sm btn-outline-secondary px-3" data-bs-dismiss="modal" style="font-size: 0.9rem;padding: 0.5rem 1rem;" data-modal-cancel>
            <i data-lucide="x" style="width: 20px; height: 20px;"></i> ${cancelText}
          </button>
          <button type="button" id="confirmSelection" class="btn btn-sm btn-primary px-3" disabled style="font-size: 0.9rem;padding: 0.5rem 1rem;" data-modal-confirm>
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
function getSelections(modalEl) {
    const procesos = Array.from(modalEl.querySelectorAll('.process-selector:checked')).map(el => parseInt(el.value));
    const cocedores = Array.from(modalEl.querySelectorAll('.cocedor-selector:checked')).map(el => parseInt(el.value));
    return { procesos, cocedores };
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
    const totalMateriales = materiales.length;

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

function validateSelection(modalEl, cocedorInputs, minSelection) {
    const procesosSeleccionados = modalEl.querySelectorAll('.process-selector:checked').length;
    const cocedoresSeleccionados = modalEl.querySelector('#cocedoresSection').style.display !== 'none'
        ? cocedorInputs.length && Array.from(cocedorInputs).some(el => el.checked)
        : false;

    const isValid = procesosSeleccionados >= minSelection && cocedoresSeleccionados;
    modalEl.querySelector('#confirmSelection').disabled = !isValid;
    modalEl.querySelector('#selectionWarning').style.display = isValid ? 'none' : 'block';
}


function handleProcessChange(modalEl, cocedorInputs, minSelection) {
    const procesosSeleccionados = modalEl.querySelectorAll('.process-selector:checked').length;
    const cocedoresSection = modalEl.querySelector('#cocedoresSection');

    if (procesosSeleccionados > 0) {
        cocedoresSection.style.display = 'block';
    } else {
        cocedoresSection.style.display = 'none';
        cocedorInputs.forEach(el => el.checked = false);
    }

    validateSelection(modalEl, cocedorInputs, minSelection);
}



export function showProcessModal(procesos = [], cocedores = [], config = {}) {
    const {
        title = 'Selección de Procesos',
        selectText = 'Seleccionar',
        cancelText = 'Cancelar',
        allowMultiple = true,
        minSelection = 1
    } = config;


    injectProcessModalStyles();
    const modalId = `processModal-${Date.now()}`;
    const html = processCocedorModalHtml({ modalId, title, procesos, cocedores, allowMultiple, minSelection, selectText, cancelText });


    const onConfirm = (e, modalEl) => {
        const { procesos, cocedores } = getSelections(modalEl);
        const warning = modalEl.querySelector('#selectionWarning');
        if (procesos.length < minSelection || cocedores.length < 1) {
            warning.classList.remove('d-none');
            throw new Error('Seleccione al menos un proceso y un cocedor.');
        }
        return { procesos, cocedores };
    };


    const onReady = (modalEl) => {
        const cocedorInputs = modalEl.querySelectorAll('.cocedor-selector');
        const processInputs = modalEl.querySelectorAll('.process-selector');
      
        // Enlazar listeners de procesos
        processInputs.forEach(el =>
          el.addEventListener('change', () => handleProcessChange(modalEl, cocedorInputs, minSelection))
        );
      
        // Enlazar listeners de cocedores
        cocedorInputs.forEach(el =>
          el.addEventListener('change', () => validateSelection(modalEl, cocedorInputs, minSelection))
        );
      
        // Evaluación inicial
        handleProcessChange(modalEl, cocedorInputs, minSelection);
      };
      



    return createModal(html, onConfirm, () => null, { backdrop: 'static', keyboard: false }, onReady);
}