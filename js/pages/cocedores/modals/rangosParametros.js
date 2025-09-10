/**
 * Rangos de validación para los parámetros del cocedor.
 * Centraliza la lógica de validación de negocio.
 */
export const RANGOS_VALIDACION = {
    flujo: {
        '1': { min: 140, max: 170, nombre: 'Flujo cocedor 1' },
        '2': { min: 140, max: 170, nombre: 'Flujo cocedor 2' },
        '3': { min: 140, max: 170, nombre: 'Flujo cocedor 3' },
        '4': { min: 140, max: 170, nombre: 'Flujo cocedor 4' },
        '5': { min: 140, max: 170, nombre: 'Flujo cocedor 5' },
        '6': { min: 150, max: 190, nombre: 'Flujo cocedor 6' },
        '7': { min: 150, max: 190, nombre: 'Flujo cocedor 7' },
    },
    tempEntrada: { min: 56, max: 70, nombre: 'Temperatura de entrada' },
    tempSalida: { min: 55, max: 60, nombre: 'Temperatura de salida' },
    ph: { min: 3.0, max: 3.8, nombre: 'pH' },
    ntu: { min: 60, max: 600, nombre: 'NTU' },
    solidos: { min: 1.5, max: 2.8, nombre: '% Sólidos' },
};


export const validarCampos = (cocedorId) => {
    return [
        { id: 'flujo', rango: RANGOS_VALIDACION.flujo[cocedorId], nombre: RANGOS_VALIDACION.flujo[cocedorId].nombre },
        { id: 'temp-entrada', rango: RANGOS_VALIDACION.tempEntrada, nombre: RANGOS_VALIDACION.tempEntrada.nombre },
        { id: 'temp-salida', rango: RANGOS_VALIDACION.tempSalida, nombre: RANGOS_VALIDACION.tempSalida.nombre },
        { id: 'ph', rango: RANGOS_VALIDACION.ph, nombre: RANGOS_VALIDACION.ph.nombre },
        { id: 'ntu', rango: RANGOS_VALIDACION.ntu, nombre: RANGOS_VALIDACION.ntu.nombre },
        { id: 'solidos', rango: RANGOS_VALIDACION.solidos, nombre: RANGOS_VALIDACION.solidos.nombre },
    ];
}