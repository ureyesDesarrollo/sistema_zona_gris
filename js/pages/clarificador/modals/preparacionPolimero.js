import { createModal } from "../../../components/modals/modal.factory.js";
import { showToast } from "../../../components/toast.js";
import { obtenerLoteQuimico } from "../../../services/clarificador.service.js";
import { fetchHtml } from "../../../utils/modalUtils.js";

// ========================================
// UI HELPERS - Manejo de overlays y mensajes
// ========================================

const createLoadingOverlay = (modalId) => {
    const overlay = document.createElement('div');
    overlay.id = `${modalId}-loading-overlay`;
    overlay.className = 'position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center';
    overlay.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        z-index: 1050;
        backdrop-filter: blur(4px);
    `;
    overlay.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <h5 class="text-primary mb-2">Consultando lote...</h5>
            <p class="text-muted mb-0">Esto puede tomar hasta 30 segundos</p>
            <div class="mt-3">
                <div class="spinner-grow spinner-grow-sm text-primary me-1" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="spinner-grow spinner-grow-sm text-primary me-1" role="status" style="animation-delay: 0.2s;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="spinner-grow spinner-grow-sm text-primary" role="status" style="animation-delay: 0.4s;">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        </div>
    `;
    return overlay;
};

const showLoadingOverlay = (modalEl, modalId) => {
    const overlay = createLoadingOverlay(modalId);
    const modalContent = modalEl.querySelector('.modal-content');
    modalContent.style.position = 'relative';
    modalContent.appendChild(overlay);
};

const hideLoadingOverlay = (modalEl, modalId) => {
    const overlay = modalEl.querySelector(`#${modalId}-loading-overlay`);
    if (overlay) {
        overlay.remove();
    }
};

const showResultMessage = (modalEl, modalId, type, message) => {
    const iconMap = {
        'success': 'check-circle',
        'danger': 'x-circle',
        'warning': 'alert-circle'
    };
    
    const resultDiv = document.createElement('div');
    resultDiv.id = `${modalId}-result-alert`;
    resultDiv.className = `alert alert-${type} fade show m-3`;
    resultDiv.style.cssText = 'animation: slideInDown 0.3s ease-out;';
    resultDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i data-lucide="${iconMap[type]}" class="me-2"></i>
            <div class="flex-grow-1">${message}</div>
        </div>
    `;
    
    const existingAlert = modalEl.querySelector(`#${modalId}-result-alert`);
    if (existingAlert) {
        existingAlert.remove();
    }
    
    const modalBody = modalEl.querySelector('.custom-modal-container');
    modalBody.insertBefore(resultDiv, modalBody.firstChild);
};

const clearResultMessage = (modalEl, modalId) => {
    const existingAlert = modalEl.querySelector(`#${modalId}-result-alert`);
    if (existingAlert) {
        existingAlert.style.animation = 'slideOutUp 0.3s ease-out';
        setTimeout(() => existingAlert.remove(), 300);
    }
};

// ========================================
// CONFIRMATION CARD - Tarjeta de confirmación
// ========================================

const createConfirmationCard = (modalId, loteData) => {
    const confirmCard = document.createElement('div');
    confirmCard.id = `${modalId}-confirm-card`;
    confirmCard.className = 'custom-modal-card mt-3';
    confirmCard.style.cssText = 'animation: slideInDown 0.3s ease-out;';
    
    confirmCard.innerHTML = `
        <div class="custom-modal-card-header">
            <div class="custom-modal-card-header-icon">
                <i data-lucide="package-check"></i>
            </div>
            <span>Lote Encontrado</span>
        </div>
        <div class="custom-modal-card-body">
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="text-muted">Número de Lote:</span>
                    <strong class="text-primary">${loteData.LOTE}</strong>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="text-muted">Nombre:</span>
                    <strong>${loteData.NOMBRE}</strong>
                </div>
            </div>
            <div class="alert alert-info mb-0">
                <i data-lucide="info" class="me-2"></i>
                ¿Desea preparar este lote de polímero?
            </div>
        </div>
    `;
    
    return confirmCard;
};

const showConfirmationCard = (modalEl, modalId, loteData) => {
    const existingCard = modalEl.querySelector(`#${modalId}-confirm-card`);
    if (existingCard) {
        existingCard.remove();
    }
    
    const confirmCard = createConfirmationCard(modalId, loteData);
    const modalContainer = modalEl.querySelector('.custom-modal-container');
    const actionsDiv = modalContainer.querySelector('.custom-modal-actions');
    modalContainer.insertBefore(confirmCard, actionsDiv);
};

const hideConfirmationCard = (modalEl, modalId) => {
    const confirmCard = modalEl.querySelector(`#${modalId}-confirm-card`);
    if (confirmCard) {
        confirmCard.style.animation = 'slideOutUp 0.3s ease-out';
        setTimeout(() => confirmCard.remove(), 300);
    }
};

// ========================================
// BUTTON MANAGEMENT - Manejo de botones
// ========================================

const updateButtons = (modalEl, modalId, mode) => {
    const btnBuscar = modalEl.querySelector(`#${modalId}-btn-buscar`);
    
    // ✅ Solo actualizar si el modo realmente cambió
    const currentMode = btnBuscar.getAttribute('data-mode');
    if (currentMode === mode) return;
    
    btnBuscar.setAttribute('data-mode', mode);
    
    if (mode === 'confirm') {
        btnBuscar.innerHTML = '<i data-lucide="check" class="me-1"></i>Confirmar Preparación';
        btnBuscar.className = 'btn btn-success';
    } else {
        btnBuscar.innerHTML = '<i data-lucide="search" class="me-1"></i>Buscar';
        btnBuscar.className = 'btn btn-primary';
    }
};

const setControlsState = (modalEl, modalId, disabled) => {
    const loteInput = modalEl.querySelector(`#${modalId}-preparacion-polimero`);
    const btnBuscar = modalEl.querySelector(`#${modalId}-btn-buscar`);
    const btnCancelar = modalEl.querySelector('[data-bs-dismiss="modal"]');
    
    if (loteInput) loteInput.disabled = disabled;
    if (btnBuscar) btnBuscar.disabled = disabled;
    if (btnCancelar) btnCancelar.disabled = disabled;
};

// ========================================
// BUSINESS LOGIC - Lógica de búsqueda
// ========================================

const handleSearchLote = async (modalEl, modalId, lote, state) => {
    if (!lote) {
        showResultMessage(modalEl, modalId, 'warning', 'Por favor ingrese un número de lote');
        const loteInput = modalEl.querySelector(`#${modalId}-preparacion-polimero`);
        loteInput?.focus();
        return;
    }

    showLoadingOverlay(modalEl, modalId);
    setControlsState(modalEl, modalId, true);

    try {
        const resultado = await obtenerLoteQuimico(lote);
        console.log("Resultado de la API:", resultado);
        
        if (resultado.error) {
            showResultMessage(modalEl, modalId, 'danger', resultado.error);
            showToast(resultado.error, "error");
            state.loteEncontrado = null;
            return;
        }

        if (!resultado.LOTE || !resultado.LOTE.length) {
            showResultMessage(modalEl, modalId, 'warning', 'No se encontró el lote especificado');
            showToast("No se encontró el lote especificado", "warning");
            state.loteEncontrado = null;
            return;
        }

        // Guardar datos del lote encontrado
        state.loteEncontrado = resultado;
        console.log("✅ loteEncontrado asignado:", state.loteEncontrado);
        
        showResultMessage(modalEl, modalId, 'success', `✓ Lote encontrado exitosamente`);
        showToast("Lote encontrado exitosamente", "success");
        
        showConfirmationCard(modalEl, modalId, resultado);
        updateButtons(modalEl, modalId, 'confirm');
        
        // Mantener input deshabilitado
        const loteInput = modalEl.querySelector(`#${modalId}-preparacion-polimero`);
        if (loteInput) loteInput.disabled = true;

    } catch (error) {
        console.error("Error al buscar lote:", error);
        showResultMessage(modalEl, modalId, 'danger', 'Error al buscar el lote. Por favor intente nuevamente.');
        showToast("Error al buscar el lote", "error");
        state.loteEncontrado = null;
    } finally {
        hideLoadingOverlay(modalEl, modalId);
        const btnBuscar = modalEl.querySelector(`#${modalId}-btn-buscar`);
        const btnCancelar = modalEl.querySelector('[data-bs-dismiss="modal"]');
        if (btnBuscar) btnBuscar.disabled = false;
        if (btnCancelar) btnCancelar.disabled = false;
        
        if (!state.loteEncontrado) {
            const loteInput = modalEl.querySelector(`#${modalId}-preparacion-polimero`);
            if (loteInput) {
                loteInput.disabled = false;
                loteInput.focus();
            }
        }
    }
};

const handleConfirmLote = (modalEl, modalId, state) => {
    if (!state.loteEncontrado) {
        showResultMessage(modalEl, modalId, 'warning', 'Primero debe buscar un lote válido');
        return false;
    }

    console.log("✅ Confirmando lote:", state.loteEncontrado);
    return state.loteEncontrado;
};

const resetModalState = (modalEl, modalId, state) => {
    // ✅ Solo limpiar si realmente hay algo que limpiar
    if (!state.loteEncontrado) return;
    
    clearResultMessage(modalEl, modalId);
    hideConfirmationCard(modalEl, modalId);
    state.loteEncontrado = null;
    updateButtons(modalEl, modalId, 'search');
    
    // Habilitar el input cuando se resetea
    const loteInput = modalEl.querySelector(`#${modalId}-preparacion-polimero`);
    if (loteInput) loteInput.disabled = false;
};

// ========================================
// EVENT HANDLERS - Manejadores de eventos
// ========================================

const setupEventHandlers = (modalEl, modalId, state, onConfirm) => {
    const btnBuscar = modalEl.querySelector(`#${modalId}-btn-buscar`);
    const loteInput = modalEl.querySelector(`#${modalId}-preparacion-polimero`);

    // ✅ Inicializar el modo del botón
    btnBuscar.setAttribute('data-mode', 'search');

    // Limpiar estado cuando el usuario escribe
    loteInput?.addEventListener('input', () => {
        resetModalState(modalEl, modalId, state);
    });

    // Manejar clic en botón principal
    btnBuscar?.addEventListener('click', async (e) => {
        if (state.loteEncontrado) {
            // Modo confirmación
            const resultado = onConfirm(e, modalEl);
            if (resultado) {
                setTimeout(() => {
                    const bsModal = bootstrap.Modal.getInstance(modalEl);
                    bsModal?.hide();
                }, 800);
            }
        } else {
            // Modo búsqueda
            const lote = loteInput?.value?.trim();
            await handleSearchLote(modalEl, modalId, lote, state);
        }
    });

    // Manejar Enter
    loteInput?.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!state.loteEncontrado) {
                const lote = loteInput?.value?.trim();
                await handleSearchLote(modalEl, modalId, lote, state);
            } else {
                const resultado = onConfirm(e, modalEl);
                if (resultado) {
                    setTimeout(() => {
                        const bsModal = bootstrap.Modal.getInstance(modalEl);
                        bsModal?.hide();
                    }, 800);
                }
            }
        }
    });

    // Focus automático
    loteInput?.focus();
};

// ========================================
// MAIN FUNCTION - Función principal
// ========================================

export async function showPreparacionPolimeroModal(config = {}) {
    const {
        title = "Preparación de polímero",
        icon = "activity",
        size = "lg",
    } = config;
    
    try {
        const modalId = `preparacion-polimero-modal`;
        let rawHtml = await fetchHtml("views/clarificador/preparacionPolimero.html");
        rawHtml = rawHtml
            .replace(/\$\{modalId\}/g, modalId)
            .replace(/\$\{title\}/g, title)
            .replace(/\$\{icon\}/g, icon)
            .replace(/\$\{size\}/g, size);

        // Estado compartido
        const state = {
            loteEncontrado: null
        };

        // Handler de confirmación
        const onConfirm = (e, modalEl) => {
            e.preventDefault();
            return handleConfirmLote(modalEl, modalId, state);
        };

        // Handler de inicialización
        const onReady = (modalEl) => {
            setupEventHandlers(modalEl, modalId, state, onConfirm);
        };

        // Crear y retornar el modal
        return createModal(
            rawHtml,
            onConfirm,
            () => null,
            { backdrop: "static", keyboard: false },
            onReady
        );

    } catch (error) {
        showToast("Error al cargar el modal", "error");
        console.error(error);
        return null;
    }
}