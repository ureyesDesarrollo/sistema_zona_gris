const createFactParams = (campo, input) => {
    return [
        { titulo: '📊 Parámetro:', valor: campo.nombre },
        { titulo: '📈 Valor detectado:', valor: input.value },
        { titulo: '✅ Rango permitido:', valor: `${campo.rango.min} - ${campo.rango.max}` },
      ];
}

const createFactReponsable = (responsable) => {
    return {
        titulo: "👤 Responsable de registro:",
        valor: responsable
      };
}


const createPayloadAlerta = (facts) => {
    return {
        titulo: "🚨 Parámetros fuera o cerca del rango permitido",
        fecha: new Date().toLocaleString('sv-SE'),
        facts: facts,
      };
}


export {
    createFactParams,
    createFactReponsable,
    createPayloadAlerta
}
