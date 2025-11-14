import { createModal } from "../../../components/modals/modal.factory.js";
import { fetchHtml } from "../../../utils/modalUtils.js";
import { showToast } from "../../../components/toast.js";
import { consultarQuimicos, fetchEstadoClarificadores } from "../../../services/clarificador.service.js";

const generarLotes = async (modalId) => {
    const lotes = await consultarQuimicos();
    console.log(lotes);

    const container = document.getElementById(`${modalId}-lotes`);
    container.innerHTML = ""; // Limpia contenido previo

    lotes.forEach(lote => {
        const col = document.createElement("div");
        col.classList.add("col-12", "d-flex");

        const idLote = `lote-${lote.quimico_id}`;

        col.innerHTML = `
            <input type="checkbox" class="lote-checkbox" id="${idLote}" value="${lote.lote}" hidden data-modal-value="lote">
            <label for="${idLote}" 
                class="lote-card d-flex align-items-center justify-content-between gap-3 p-3 rounded-4 shadow-sm border position-relative w-100" 
                style="max-width: 500px;">
                
                <!-- Sección izquierda: ícono + info -->
                <div class="d-flex align-items-center gap-3">
                    <div class="lote-icon bg-light rounded-circle p-2 d-flex align-items-center justify-content-center">
                        <i data-lucide="package"></i>
                    </div>
                    <div>
                        <h6 class="mb-0 fw-semibold">Lote: ${lote.lote}</h6>
                        <small class="text-muted">${lote.nombre_quimico || "Polímero"}</small>
                    </div>
                </div>

                <!-- Sección derecha: check -->
                <div class="checkmark-wrapper">
                    <i class="checkmark" data-lucide="check-circle"></i>
                </div>
            </label>
        `;

        container.appendChild(col);
    });

    lucide.createIcons();
};

const generarClarificadores = async (modalId) => {
    const clarificadores = await fetchEstadoClarificadores();
    console.log(clarificadores);

    const container = document.getElementById(`${modalId}-clarificadores`);
    container.innerHTML = "";

    clarificadores
        .filter(c => c.estatus === "ACTIVO")
        .forEach(clarificador => {

            const idClarificador = `clarificador-${clarificador.clarificador_id}`;

            const wrapper = document.createElement("div");
            wrapper.classList.add("col-12", "d-flex");

            wrapper.innerHTML = `
                <input type="checkbox"
                    class="lote-checkbox"
                    id="${idClarificador}"
                    value="${clarificador.clarificador_id}"
                    hidden data-modal-value="clarificador">

                <label for="${idClarificador}"
                    class="lote-card d-flex align-items-center justify-content-between
                        gap-3 p-3 rounded-4 shadow-sm border position-relative w-100"
                    style="max-width: 480px; cursor: pointer;">

                    <!-- IZQUIERDA -->
                    <div class="d-flex align-items-center gap-3">
                        <div class="lote-icon bg-light rounded-circle p-2 d-flex
                            align-items-center justify-content-center">
                            <i data-lucide="flask-conical"></i>
                        </div>

                        <div>
                            <h6 class="mb-0 fw-semibold">
                                ${clarificador.nombre}
                            </h6>
                        </div>
                    </div>

                    <!-- CHECK -->
                    <div class="checkmark-wrapper d-flex align-items-center">
                        <i class="checkmark" data-lucide="check-circle"></i>
                    </div>

                </label>
            `;

            container.appendChild(wrapper);
        });

    if (window.lucide) {
        lucide.createIcons();
    }
};

const getModalValues = (modalId) => {
    const modalEl = document.getElementById(modalId);

    const values = {
        lotes: [],
        clarificadores: [],
        cantidad: "",
        observaciones: ""
    };

    // 1. Checkboxes seleccionados
    const checkedInputs = modalEl.querySelectorAll('input[data-modal-value]:checked');

    checkedInputs.forEach(input => {
        const type = input.dataset.modalValue; // lote / clarificador
        const value = input.value;

        if (type === "lote") {
            values.lotes.push(value);
        } else if (type === "clarificador") {
            values.clarificadores.push(value);
        }
    });

    // 2. Inputs normales (text, number...)
    const otherInputs = modalEl.querySelectorAll('input:not([type="checkbox"])[data-modal-value]');

    otherInputs.forEach(input => {
        values[input.dataset.modalValue] = input.value;
    });

    values["observaciones"] = modalEl.querySelector('[data-modal-value="observaciones"]').value;

    return values;
};



export async function showRegistroPolimeroModal(config = {}) {
    const {
        title = "Registro de polímero",
        icon = "activity",
        size = "lg",
    } = config;

    try {
        const modalId = `registro-polimero-modal`;
        let rawHtml = await fetchHtml("views/clarificador/registroPolimero.html");
        rawHtml = rawHtml
            .replace(/\$\{modalId\}/g, modalId)
            .replace(/\$\{title\}/g, title)
            .replace(/\$\{icon\}/g, icon)
            .replace(/\$\{size\}/g, size);

        const onConfirm = (e, modalEl) => {
            e.preventDefault();
            const values = getModalValues(modalId);
            if(values.lotes.length === 0 || values.clarificadores.length === 0){
                showToast("Debe seleccionar al menos un lote y un clarificador", "error");
                return;
            }

            if(values.cantidad === ""){
                showToast("Debe ingresar la cantidad", "error");
                return;
            }

            const payload = {
                lotes: values.lotes,
                clarificadores: values.clarificadores,
                cantidad: values.cantidad,
                observaciones: values.observaciones ?? "N/A"
            };

            return payload;
        };

        // Handler de inicialización
        const onReady = (modalEl) => {
            generarLotes(modalId);
            generarClarificadores(modalId);
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