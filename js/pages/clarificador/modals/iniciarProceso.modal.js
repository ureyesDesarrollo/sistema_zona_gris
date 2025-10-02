import { createModal } from "../../../components/modals/modal.factory.js";
import { procesosHtml } from "../../../components/procesosList.js";
import { showToast } from "../../../components/toast.js";

function processClarificadorModalHtml({ modalId, title, procesos, selectText, cancelText, clarificadores }) {
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
          </div>
        </div>
        <div class="modal-body p-0" style="max-height: 65vh; overflow-y: auto;">
          <div class="p-3 border-bottom">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-semibold text-primary m-0">Procesos Disponibles</h5>
            </div>
            <div class="list-group">
              ${procesos.map(proceso => procesosHtml(proceso)).join('') || 'No hay procesos disponibles'}
            </div>
          </div>
        </div>
        
        <div class="modal-footer py-3 px-4" style="background: #f8f9fa;border-radius: 0 0 12px 12px;border-top: 1px solid #e0e0e0;">
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

export async function showProcessModal(procesos = [], clarificadores = [], config = {}) {
    const {
        title = 'Selección de Procesos',
        selectText = 'Seleccionar',
        cancelText = 'Cancelar',
    } = config;

    try {

        const modalId = `processModal-${Date.now()}`;
        const html = processClarificadorModalHtml({ modalId, title, procesos, clarificadores, selectText, cancelText });

        const onConfirm = (e, modalEl) => {
            const idAgrupacion = modalEl.querySelector('.process-selector:checked').dataset.proceso;
            return { proceso_agrupado_id: parseInt(idAgrupacion), clarificador_id: 1 };
        };

        const onReady = (modalEl) => {
            const procesos = modalEl.querySelectorAll('.process-selector');
            procesos.forEach(proceso => {
                proceso.addEventListener('change', () => {
                    const selected = Array.from(procesos).filter(p => p.checked).length;
                    const confirmButton = modalEl.querySelector('#confirmSelection');
                    confirmButton.disabled = selected === 0;
                });
            });
        };

        return createModal(html, onConfirm, () => null, { backdrop: "static", keyboard: false }, onReady);
    } catch (error) {
        console.error(error);
        showToast("Error al cargar el modal", "error");
    }
}