import { formatter } from "./formatter.js";

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

/**
 * Agrupa y suma las cantidades de materiales con el mismo nombre.
 * @param {Array<Object>} materiales - Lista de materiales sin procesar.
 * @returns {Array<Object>} Un array con los materiales agrupados.
 */
export const reduceMateriales = (materiales) => {
    if (!Array.isArray(materiales) || materiales.length === 0) {
        return [];
    }
    return Object.values(materiales.reduce((acc, item) => {
        const nombre = item.nombre.trim();
        const cantidadNum = parseFloat(item.cantidad);

        if (!acc[nombre]) {
            acc[nombre] = { nombre, cantidad: 0 };
        }
        acc[nombre].cantidad += cantidadNum;
        return acc;
    }, {}));
};

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