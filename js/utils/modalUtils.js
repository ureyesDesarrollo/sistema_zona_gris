/**
 * Obtiene el valor de un campo del formulario en un modal.
 * @param {HTMLElement} modalEl El elemento del modal.
 * @param {string} id El ID del campo.
 * @returns {string} El valor del campo.
 */
const getModalValue = (modalEl, id) => modalEl.querySelector(`[data-modal-value="${id}"]`)?.value || "";

/**
 * Obtiene el valor de un radio button del formulario en un modal.
 * @param {HTMLElement} modalEl El elemento del modal.
 * @param {string} name El nombre del grupo de radio buttons.
 * @returns {string} El valor del radio button seleccionado.
 */
const getModalRadioValue = (modalEl, name) => modalEl.querySelector(`[data-modal-radio="${name}"]:checked`)?.value || "";

/**
 * Establece el valor de un campo del formulario en un modal.
 * @param {HTMLElement} modalEl El elemento del modal.
 * @param {string} id El ID del campo.
 * @param {string} valor El valor a establecer.
 */
const setValor = (modalEl, id, valor) => {
    const el = modalEl.querySelector(`[data-modal-value="${id}"]`);
    if (el) el.value = valor;
};

/**
 * Prepara el HTML del modal y lo inyecta en el DOM.
 * @param {string} templatePath La ruta del archivo HTML.
 * @returns {Promise<string>} El HTML del modal.
 */
async function fetchHtml(templatePath) {
    const res = await fetch(templatePath);
    if (!res.ok) throw new Error("No se pudo cargar el HTML del modal");
    return await res.text();
}

export { getModalValue, getModalRadioValue, fetchHtml, setValor };
