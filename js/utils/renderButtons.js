/**
 * Genera el HTML para un botón de acción.
 * @param {string} className - Clase CSS del botón.
 * @param {string} title - Título del botón.
 * @param {string} iconName - Nombre del ícono de Lucide.
 * @param {string} btnText - Texto del botón.
 * @param {string} [dataId] - ID para el atributo data-id.
 * @param {boolean} [disabled=false] - Indica si el botón debe estar deshabilitado.
 * @returns {string} El HTML del botón.
 */
export const renderButton = (className, title, iconName, btnText, dataId, disabled = false) => {
    const disabledAttr = disabled ? 'disabled' : '';
    const dataAttr = dataId ? `data-id="${dataId}"` : '';
    const classAttr = className.startsWith('btn-registrar-disabled') ? className : `${className} pulse-hover`;
    
    return `
        <button class="btn btn-action ${classAttr}"
                title="${title}"
                aria-label="${title}"
                ${dataAttr}
                ${disabledAttr}>
            <i data-lucide="${iconName}"></i>
            <span class="btn-text">${btnText}</span>
        </button>
    `;
};