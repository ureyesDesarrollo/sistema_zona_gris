const NOMBRE_PARAM = {
    flujo: 'Flujo',
    tempEntrada: 'T° entrada',
    tempSalida: 'T° salida',
    ph: 'pH',
    ntu: 'NTU',
    solidos: '% Sólidos',
    cargaCuero: 'Carga de cuero'
  };
  
  // Rango -> fuera de rango?
  function estaFueraDeRango(valor, rango) {
    if (valor == null || valor === '' || isNaN(Number(valor))) return false; // vacío no acusa
    const v = Number(valor);
    return !(v >= rango.min && v <= rango.max);
  }
  
  // Construye texto del prefacio
  export function construirPrefacioObservaciones(valores, rangos, cambios = []) {
    const fuera = Object.keys(rangos)
      .filter(k => estaFueraDeRango(valores[k], rangos[k]))
      .map(k => NOMBRE_PARAM[k] || k);
  
    let lineas = [];
    if (fuera.length) {
      lineas.push(`Parámetros fuera de rango: [${fuera.join(', ')}].`);
    } else {
      lineas.push('Parámetros dentro de rango.');
    }
    lineas.push('Cambios realizados:'); // el operador escribe debajo
  
    return lineas.join('\n');
  }
  
  /**
   * Bloquea un prefacio en el textarea para que no pueda borrarse.
   * El usuario sólo puede escribir DESPUÉS del prefacio.
   */
  export function fijarPrefacioBloqueado(textarea, prefacio) {
    if (!textarea) return;
    const prefix = (prefacio || '') + '\n'; // dejamos una línea libre
  
    // Guardamos el prefacio en dataset
    textarea.dataset.lockPrefix = prefix;
  
    // Componemos el valor (si el usuario ya había escrito, conservarlo)
    const actual = textarea.value || '';
    const yaTenia = actual.startsWith(prefix);
    textarea.value = yaTenia ? actual : prefix;
  
    // Mover el cursor después del prefacio
    const moverCursor = () => textarea.setSelectionRange(prefix.length, prefix.length);
  
    // No permitir borrar el prefacio
    const proteger = (e) => {
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;
  
      // Si intenta escribir o borrar dentro del prefacio, lo movemos
      const tocandoPrefacio = start < prefix.length || end < prefix.length;
      const esDelete = e.inputType?.startsWith('delete');
  
      if (tocandoPrefacio || esDelete && start < prefix.length) {
        e.preventDefault?.();
        moverCursor();
      }
    };
  
    textarea.addEventListener('beforeinput', proteger);
    textarea.addEventListener('keydown', (e) => {
      const start = textarea.selectionStart ?? 0;
      if ((e.key === 'Backspace' || e.key === 'ArrowLeft') && start <= prefix.length) {
        e.preventDefault();
        moverCursor();
      }
    });
  
    // Si por alguna razón el valor dejó de comenzar por el prefacio, lo restauramos
    textarea.addEventListener('input', () => {
      if (!textarea.value.startsWith(prefix)) {
        const resto = textarea.value.slice(prefix.length);
        textarea.value = prefix + resto;
        moverCursor();
      }
    });
  
    textarea.addEventListener('focus', moverCursor);
    moverCursor();
  }
  
  /**
   * Actualiza el prefacio sin perder lo que el usuario escribió después.
   */
  export function actualizarPrefacioBloqueado(textarea, nuevoPrefacio) {
    if (!textarea) return;
    const old = textarea.dataset.lockPrefix || '';
    const nuevo = (nuevoPrefacio || '') + '\n';
    if (old === nuevo) return;
  
    const userPart = (textarea.value || '').slice(old.length);
    textarea.dataset.lockPrefix = nuevo;
    textarea.value = nuevo + userPart;
    textarea.setSelectionRange(nuevo.length, nuevo.length);
  }
  