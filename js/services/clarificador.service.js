import { FUNCIONES, CATALOGOS, BASE_API, REPORTES } from "../config.js";
import { fetchApi } from "../utils/api.js"

export const fetchEstadoClarificadores = async () => {
    try {
        const res = await fetchApi(`${FUNCIONES}/clarificador/obtenerEstadoClarificador`);
        if (!res.success) throw new Error(res.error);
        return res.data;
    } catch (e) {
        console.error(`Error al obtener estado de clarificadores`, e);
        return { error: "Error al obtener estado de clarificadores", data: null };
    }
}

export const fetchProcesosActivos = async () => {
    try {
        const res = await fetchApi(`${FUNCIONES}/clarificador/obtenerProcesosActivos`);
        if (!res.success) throw new Error(res.error);
        return res.data;
    } catch (e) {
        console.error(`Error al obtener procesos activos`, e);
        return { error: "Error al obtener procesos activos", data: null };
    }
}

export const iniciarProceso = async (payload) => {
    try {
        const res = await fetchApi(`${FUNCIONES}/clarificador/iniciarProcesoClarificador`, 'POST', JSON.stringify(payload));
        if (!res.success) throw new Error(res.error);
        return res.data;
    } catch (e) {
        console.error(`Error al iniciar proceso`, e);
        return { error: "Error al iniciar proceso", data: null };
    }
}

export const obtenerClarificadorProcesoById = async (clarificadorId) => {
    try {
        const res = await fetchApi(`${FUNCIONES}/clarificador/obtenerClarificadorProcesoById/${clarificadorId}`);
        if (!res.success) throw new Error(res.error);
        return res.data;
    } catch (e) {
        console.error(`Error al obtener clarificador`, e);
        return { error: "Error al obtener clarificador", data: null };
    }
}

export const registrarParametros = async (payload) => {
    try {
        const res = await fetchApi(`${FUNCIONES}/clarificador/insertarRegistroHorario`, 'POST', JSON.stringify(payload));
        if (!res.success) throw new Error(res.error);
        return res.data;
    } catch (e) {
        console.error(`Error al registrar parametros`, e);
        return { error: "Error al registrar parametros", data: null };
    }
}


export const obtenerDetalleClarificadorProceso = async (id) => {
    try{
        const res = await fetchApi(`${FUNCIONES}/clarificador/obtenerDetalleClarificadorProceso/${id}`);
        if (!res.success) throw new Error(res.error);
        return res.data;
    }catch(e){
        console.error(`Error al obtener detalle de clarificador`, e);
        return { error: "Error al obtener detalle de clarificador", data: null };
    }
}

export const validacionHora = async (payload) => {
    try {
        const res = await fetchApi(`${FUNCIONES}/clarificador/validacionHora`, 'POST', JSON.stringify(payload));
        if (!res.success) throw new Error(res.error);
        return res.data;
    } catch (e) {
        console.error(`Error al validar hora`, e);
        return { error: "Error al validar hora", data: null };
    }
}
