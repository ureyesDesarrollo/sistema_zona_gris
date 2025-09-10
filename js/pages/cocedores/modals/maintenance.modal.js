import { createModal } from "../../../components/modals/modal.factory.js";

// js/modals/maintenance.modal.js
function getMaintenanceHtml({ modalId, title, label, placeholder, okText, cancelText, minLength, maxLength }) {
    return `
  <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}-label" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="${modalId}-label"><i data-lucide="wrench" class="me-2 text-warning"></i>${title}</h5>
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
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" data-modal-cancel>${cancelText}</button>
          <button type="button" class="btn btn-primary" data-modal-confirm disabled>${okText}</button>
        </div>
      </div>
    </div>
  </div>`;
}

export const showMaintenanceModal = (options = {}) => {
    const modalId = `maintModal-${Date.now()}`;
    const { minLength = 3, maxLength = 500 } = options;
    const html = getMaintenanceHtml({ modalId, ...options, minLength, maxLength });

    return createModal(
        html,
        (e, modalEl) => {
            const textarea = modalEl.querySelector('textarea');
            const value = textarea.value.trim();
            if (value.length < minLength) {
                modalEl.querySelector('.invalid-feedback').style.display = 'block';
                throw new Error("El motivo es muy corto.");
            }
            return value;
        },
        () => null,
        { backdrop: 'static', keyboard: false },
        (modalEl) => {
            const textarea = modalEl.querySelector('textarea');
            const counter = modalEl.querySelector(`#${modalId}-counter`);
            const confirmBtn = modalEl.querySelector('[data-modal-confirm]');
            const error = modalEl.querySelector('.invalid-feedback');

            const updateUI = () => {
                const length = textarea.value.trim().length;
                if (counter) counter.textContent = `${length} / ${maxLength}`;
                if (length >= minLength) {
                    confirmBtn.disabled = false;
                    error.style.display = 'none';
                } else {
                    confirmBtn.disabled = true;
                }
            };

            textarea.addEventListener('input', updateUI);
            // Ejecuta una vez al iniciar
            updateUI();
        }
    );
};
