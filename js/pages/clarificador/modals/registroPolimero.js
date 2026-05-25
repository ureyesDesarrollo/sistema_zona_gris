import { createModal } from "../../../components/modals/modal.factory.js";
import { fetchHtml } from "../../../utils/modalUtils.js";
import { showToast } from "../../../components/toast.js";
import { cambiarEstatusQuimico, consultarQuimicos, fetchEstadoClarificadores, obtenerUltimoLote, validUserCode } from "../../../services/clarificador.service.js";
import { getUserId } from "../../../utils/session.js";
import { debounce } from "../../../utils/debounce.js";

const generarLotes = async (modalId) => {
    const lotes = await consultarQuimicos();

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


const setupUniqueSelections = (modalId) => {
    const modalEl = document.getElementById(modalId);

    if (!modalEl) return;

    const resetControlFields = () => {
        const claveDiv = modalEl.querySelector(`#${modalId}-clave-div`);
        const controlDiv = modalEl.querySelector(`#${modalId}-control-div`);
        const claveInput = modalEl.querySelector(`#${modalId}-clave`);
        const idControlInput = modalEl.querySelector(`[data-modal-value="id-control"]`);

        if (claveDiv && !claveDiv.classList.contains("d-none")) {
            claveDiv.classList.add("d-none");
            if (controlDiv) controlDiv.classList.add("d-none");
            if (claveInput) claveInput.value = "";
            if (idControlInput) idControlInput.value = "";
        }
    };

    // Delegación: escuchamos cambios dentro del modal
    modalEl.addEventListener("change", (e) => {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;

        // Si es un lote -> desmarcar demás lotes y resetear control
        if (target.dataset.modalValue === "lote") {
            const allLotes = modalEl.querySelectorAll('input[data-modal-value="lote"]');
            allLotes.forEach(cb => {
                if (cb !== target) cb.checked = false;
            });

            // Si el usuario cambió la selección de lote, ocultamos/limpiamos control
            resetControlFields();
        }

        // Si es un clarificador -> desmarcar demás clarificadores
        if (target.dataset.modalValue === "clarificador") {
            const allClar = modalEl.querySelectorAll('input[data-modal-value="clarificador"]');
            allClar.forEach(cb => {
                if (cb !== target) cb.checked = false;
            });
        }
    }, { passive: true });
};



const validarClave = (modalId) => {
    const claveInput = document.getElementById(`${modalId}-clave`);
    const controlInput = document.getElementById(`${modalId}-control`);
    const idControlInput = document.querySelector(`[data-modal-value="id-control"]`);
    const validar = debounce(async () => {
        const clave = claveInput.value;
        if (clave.length === 0) {
            controlInput.value = "";
            return;
        }
        const res = await validUserCode({ clave });

        if (res.error) {
            controlInput.value = "";
            controlInput.classList.add("custom-modal-form-control-invalid");
            claveInput.classList.add("custom-modal-form-control-invalid");
            return;
        }

        if (res.up_id !== '6') {
            claveInput.classList.add("custom-modal-form-control-invalid");
            showToast("La clave no pertenece a un usuario de laboratorio", "error");
            return;
        }

        controlInput.classList.remove("custom-modal-form-control-invalid");
        claveInput.classList.remove("custom-modal-form-control-invalid");
        controlInput.value = res.usu_nombre;
        idControlInput.value = res.usu_id;

    }, 700);

    claveInput.addEventListener("input", validar);
    controlInput.addEventListener("input", validar);
}


const getModalValues = (modalId) => {
    const modalEl = document.getElementById(modalId);

    const values = {
        lotes: [],
        clarificadores: [],
        cantidad: "",
        observaciones: "",
        control_procesos_id: ""
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
    values["control_procesos_id"] = modalEl.querySelector('[data-modal-value="id-control"]').value;

    return values;
};



export async function showRegistroPolimeroModal(config = {}) {
    const {
        title = "Registro de polímero",
        icon = "activity",
        size = "lg",
    } = config;

    try {
        const user = getUserId();
        const modalId = `registro-polimero-modal`;
        let rawHtml = await fetchHtml("views/clarificador/registroPolimero.html");
        rawHtml = rawHtml
            .replace(/\$\{modalId\}/g, modalId)
            .replace(/\$\{title\}/g, title)
            .replace(/\$\{icon\}/g, icon)
            .replace(/\$\{size\}/g, size);

        const onConfirm = async (e, modalEl) => {
            e.preventDefault();
            const values = getModalValues(modalId);

            if (values.lotes.length === 0 || values.clarificadores.length === 0) {
                showToast("Debe seleccionar al menos un lote y un clarificador", "error");
                return false;
            }

            if (values.cantidad === "") {
                showToast("Debe ingresar la cantidad", "error");
                return false;
            }

            const ultimoLote = await obtenerUltimoLote({ lote: values.lotes[0] });
            const inputControlID = modalEl.querySelector(`[data-modalValue="id-control"], [data-modal-value="id-control"]`)
                || modalEl.querySelector('[data-modal-value="id-control"]');

            const idControlActual = inputControlID?.value || "";
            const idControlProceso = ultimoLote.control_procesos_id ?? "";
            const loteAnterior = ultimoLote.loteAnterior ?? "";
            const loteActual = values.lotes[0];


            // 1) Si NO hay control_procesos en BD y tampoco hay uno manual todavía → pedir clave
            if (ultimoLote.error && !idControlActual) {
                showToast(`${ultimoLote.error}, solicitar validación de lote a personal de control de procesos`, "error");

                modalEl.querySelector(`#${modalId}-clave-div`)?.classList.remove("d-none");
                modalEl.querySelector(`#${modalId}-control-div`)?.classList.remove("d-none");
                modalEl.querySelector(`#${modalId}-clave`)?.focus();

                // ᐅ SI cambiaste de lote, cambia el estatus del lote anterior
                if (loteAnterior && loteAnterior !== loteActual) {
                    await cambiarEstatusQuimico({ lote: loteAnterior });
                }

                return false;
            }

            // 2) Si hay control_procesos_id en BD y todavía no se ha llenado el campo manual, úsalo
            if (idControlProceso && !idControlActual) {
                inputControlID.value = idControlProceso;
            }

            // ᐅ SI cambiaste de lote, cambiar estatus ANTES de guardar
            if (loteAnterior && loteAnterior !== loteActual) {
                await cambiarEstatusQuimico(loteAnterior );
            }

            // 3) Debemos tener algún control (manual o BD)
            const controlFinal = inputControlID.value;
            if (!controlFinal) {
                showToast("Debe validar el lote con control de procesos", "error");
                return false;
            }


            const payload = {
                quimico_lote: values.lotes[0],
                clarificador_id: values.clarificadores[0],
                cantidad: values.cantidad,
                usuario_id: user,
                observaciones: values.observaciones ?? "N/A",
                control_procesos_id: controlFinal, // SIEMPRE el definitivo
            };

            return payload;
        };


        // Handler de inicialización
        const onReady = (modalEl) => {
            generarLotes(modalId);
            generarClarificadores(modalId);
            validarClave(modalId);
            setupUniqueSelections(modalId);
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