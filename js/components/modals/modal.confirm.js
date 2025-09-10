// js/modals/confirm.modal.js
import { createModal } from "./modal.factory.js";
function getConfirmHtml({ modalId, title, message, okText, cancelText, okClass, cancelClass, icon }) {
    return `
    <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}-label" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="${modalId}-label"><i data-lucide="${icon}" class="text-warning me-2"></i>${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body"><p>${message}</p></div>
          <div class="modal-footer">
            <button type="button" class="btn ${cancelClass}" data-bs-dismiss="modal" data-modal-cancel>${cancelText}</button>
            <button type="button" class="btn ${okClass}" data-modal-confirm>${okText}</button>
          </div>
        </div>
      </div>
    </div>`;
}

export const showConfirm = (message, title = 'Confirmación', options = {}) => {
    const modalId = `confirmModal-${Date.now()}`;
    const html = getConfirmHtml({
        modalId,
        title,
        message,
        okText: options.okText || 'Aceptar',
        cancelText: options.cancelText || 'Cancelar',
        okClass: options.okClass || 'btn-primary',
        cancelClass: options.cancelClass || 'btn-outline-secondary',
        icon: options.icon || 'triangle-alert'
    });
    return createModal(html, () => true, () => false, { backdrop: 'static', keyboard: false });
};