// js/modals/modal.factory.js

import { showToast } from "../toast.js";

/**
 * Función fábrica para crear modales dinámicamente.
 *
 * @param {string} html El contenido HTML del modal.
 * @param {function} onConfirmHandler La función que se ejecuta al confirmar.
 * @param {function} onCancelHandler La función que se ejecuta al cancelar.
 * @param {object} bootstrapOptions Opciones del modal de Bootstrap.
 */
export const createModal = (
  html,
  onConfirmHandler,
  onCancelHandler,
  bootstrapOptions = {},
  onReady
) => {
  return new Promise((resolve, reject) => {
    let settled = false;
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = html.trim();
    const modalEl = tempContainer.firstElementChild;

    if (!modalEl) {
      console.error('[createModal] HTML inválido:', html);
      throw new Error('No se pudo crear el modal. El HTML es inválido.');
    }

    document.body.appendChild(modalEl);

    const defaultOptions = {
      backdrop: true,
      keyboard: true,
      focus: true,
    };

    const options = { ...defaultOptions, ...bootstrapOptions };
    const modal = new bootstrap.Modal(modalEl, options);

    const cleanup = (value = null) => {
      if (settled) return;
      settled = true;
      modal.dispose();
      modalEl.remove();
      resolve(value);
    };

    const confirmBtn = modalEl.querySelector('[data-modal-confirm]');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async (e) => {
        try {
          const result = await onConfirmHandler(e, modalEl);
          if (result === false || result === undefined) {
            // No hacer nada, el modal permanece abierto
            return;
          }
          
          cleanup(result);
        } catch (error) {
          showToast(error.message || 'Ocurrió un error en la acción.', 'error');
          reject(error);
        }
      });
    }

    const cancelBtn = modalEl.querySelector('[data-modal-cancel]');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cleanup(onCancelHandler ? onCancelHandler() : null);
      });
    }

    modalEl.addEventListener('hidden.bs.modal', () => cleanup());

    modalEl.addEventListener('shown.bs.modal', () => {
      if (typeof onReady === 'function') {
        onReady(modalEl);
      }
    });

    modal.show();
  });
};
