export const RANGOS_VALIDACION = {
    solidosEntrada: { min: 1.5, max: 2.8, nombre: '% Sólidos de entrada' },
    flujoSalida: { min: 300, max: 1350, nombre: 'Flujo de salida' },
    ntuEntrada: { min: 50, max: 600, nombre: 'NTU de entrada' },
    ntuSalida: { min: 5, max: 15, nombre: 'NTU de salida' },
    phEntrada: { min: 3.0, max: 3.8, nombre: 'pH de entrada' },
    phElectrodo: { min: 5.5, max: 6.5, nombre: 'pH Electrodo Clarificador' },
    phControlProcesos: { min: 5.5, max: 6.5, nombre: 'pH Control Procesos' },
    dosificacionPolimero: { min: 5, max: 20, nombre: 'Dosificación de polimero' },
    presion: { min: 2.0, max: 4.0, nombre: 'Presión' },
    entradaAire: { min: 40, max: 60, nombre: 'Entrada Aire' },
    varometro: { min: -15, max: -5, nombre: 'Varómetro' },
    nivelNata: { min: 7, max: 10, nombre: 'Nivel De Nata' },
    filtro_1: { min: 0.5, max: 1.5, nombre: 'Filtro 1' },
    filtro_2: { min: 0.5, max: 1.5, nombre: 'Filtro 2' },
    filtro_3: { min: 0.5, max: 1.5, nombre: 'Filtro 3' },
    filtro_4: { min: 0.5, max: 1.5, nombre: 'Filtro 4' },
    filtro_5: { min: 0.5, max: 1.5, nombre: 'Filtro 5' },
    
}

export const validarCampos = () => {
    return [
        { id: 'solidos-entrada', rango: RANGOS_VALIDACION.solidosEntrada, nombre: RANGOS_VALIDACION.solidosEntrada.nombre, requerido: true },
        { id: 'flujo-salida', rango: RANGOS_VALIDACION.flujoSalida, nombre: RANGOS_VALIDACION.flujoSalida.nombre, requerido: true },
        { id: 'ntu-entrada', rango: RANGOS_VALIDACION.ntuEntrada, nombre: RANGOS_VALIDACION.ntuEntrada.nombre, requerido: true },
        { id: 'ntu-salida', rango: RANGOS_VALIDACION.ntuSalida, nombre: RANGOS_VALIDACION.ntuSalida.nombre, requerido: true },
        { id: 'ph-entrada', rango: RANGOS_VALIDACION.phEntrada, nombre: RANGOS_VALIDACION.phEntrada.nombre, requerido: true },
        { id: 'ph-electrodo', rango: RANGOS_VALIDACION.phElectrodo, nombre: RANGOS_VALIDACION.phElectrodo.nombre, requerido: true },
        { id: 'ph-control-procesos', rango: RANGOS_VALIDACION.phControlProcesos, nombre: RANGOS_VALIDACION.phControlProcesos.nombre, requerido: true },
        { id: 'dosificacion-polimero', rango: RANGOS_VALIDACION.dosificacionPolimero, nombre: RANGOS_VALIDACION.dosificacionPolimero.nombre, requerido: true },
        { id: 'presion', rango: RANGOS_VALIDACION.presion, nombre: RANGOS_VALIDACION.presion.nombre, requerido: true },
        { id: 'entrada-aire', rango: RANGOS_VALIDACION.entradaAire, nombre: RANGOS_VALIDACION.entradaAire.nombre, requerido: true },
        { id: 'varometro', rango: RANGOS_VALIDACION.varometro, nombre: RANGOS_VALIDACION.varometro.nombre, requerido: true },
        { id: 'nivel-nata', rango: RANGOS_VALIDACION.nivelNata, nombre: RANGOS_VALIDACION.nivelNata.nombre, requerido: true },
        { id: 'filtro-1', rango: RANGOS_VALIDACION.filtro_1, nombre: RANGOS_VALIDACION.filtro_1.nombre, requerido: false },
        { id: 'filtro-2', rango: RANGOS_VALIDACION.filtro_2, nombre: RANGOS_VALIDACION.filtro_2.nombre, requerido: false },
        { id: 'filtro-3', rango: RANGOS_VALIDACION.filtro_3, nombre: RANGOS_VALIDACION.filtro_3.nombre, requerido: false },
        { id: 'filtro-4', rango: RANGOS_VALIDACION.filtro_4, nombre: RANGOS_VALIDACION.filtro_4.nombre, requerido: false },
        { id: 'filtro-5', rango: RANGOS_VALIDACION.filtro_5, nombre: RANGOS_VALIDACION.filtro_5.nombre, requerido: false },
    ];
}
