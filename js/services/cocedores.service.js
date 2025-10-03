import { FUNCIONES, CATALOGOS, BASE_API, REPORTES } from "../config.js";
import { fetchApi } from "../utils/api.js"
import { getLocalDateTimeString } from "../utils/getLocalDateTimeString.js";

export async function fetchCocedores() {
  
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/estado`);
    if (!res.success) throw new Error(res.error);
    return res.data;
  } catch (err) {
    console.error('[fetchCocedores]', err);
    return null;
  }
}

export async function fetchProximaRevision() {
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/proxima-revision`);
    if (!res.success) throw new Error(res.error);
    const { proxima_revision } = res.data;
    return proxima_revision;
  } catch (err) {
    console.error('[fetchProximaRevision]', err);
    return null;
  }
}

export const changeStatus = async (id, estatus) => {
  try {
    const res = await fetchApi(`${CATALOGOS}/cocedor/${id}/estatus`, 'PUT', JSON.stringify({ estatus }));
    return res;
  } catch (e) {
    console.error(`Error en changeStatus del cocedor ${id} a ${estatus}`, e);
    return { error: "Error al cambiar estatus de cocedor" }
  }
};

export const registrarParo = async (payload) => {
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/paro`, 'POST', JSON.stringify(payload));
    return res;
  } catch (e) {
    console.error(`Error en registrarParo del cocedor ${payload.id}`, e);
    return { error: "Error al registrar paro de cocedor" }
  }
};

export const finalizarParo = async (payload) => {
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/finalizar-paro`, 'POST', JSON.stringify(payload));
    return res;
  } catch (e) {
    console.error(`Error en finalizarParo del cocedor ${payload.id}`, e);
    return { error: "Error al finalizar paro de cocedor" }
  }
};


export const fetchProcesos = async () => {
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/procesos-disponibles`);
    return res;
  } catch (err) {
    console.error('[fetchProcesos]', err);
    return null;
  }
}

export async function iniciarProcesos(payload) {
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/combinar-procesos`, 'POST', JSON.stringify(payload));
    return res;
  } catch (e) {
    console.error(`Error al iniciar procesos`, e);
    return { error: "Error al iniciar procesos" }
  }
}

export const obtenerCocedoresProcesoById = async (id) => {
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/obtener-cocedores-proceso-by-id/${id}`);
    return res;
  } catch (err) {
    console.error('[obtenerCocedoresProceso]', err);
    return null;
  }
}

export const obtenerFlujos = async () => {
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/obtener-flujo`);
    if (!res.success) throw new Error(res.error);
    return res.data;
  } catch (err) {
    console.error('[obtenerFlujos]', err);
    return null;
  }
}

export const obtenerTemperaturaCocedores = async () => {
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/obtener-temperatura`);
    if (!res.success) throw new Error(res.error);
    return res.data[0];
  } catch (err) {
    console.error('[obtenerTemperaturaCocedores]', err);
    return null;
  }
}

export const validarConsecutividadHoraXHora = async (id) => {
  try {
    const now = new Date();
  const fechaHora = getLocalDateTimeString(now);
    const res = await fetchApi(`${FUNCIONES}/cocedores/validar-consecutividad/${id}/${fechaHora}`);
    if (!res.success) throw new Error(res.error);
    return res.data;
  } catch (err) {
    console.error('[vaidarConsecutividadHoraXHora]', err);
    return null;
  }
}

export const registrarHoraXHora = async (payload) => {
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/registro-horario`, 'POST', JSON.stringify(payload));
    return res;
  } catch (e) {
    console.error(`Error al registrar hora x hora`, e);
    return { error: "Error al registrar hora x hora" }
  }
}

export const obtenerDetelleCocedorProceso = async (id) => {
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/obtener-detalle-cocedor-proceso/${id}`);
    if (!res.success) throw new Error(res.error);
    return res.data[0];
  } catch (err) {
    console.error('[obtenerDetelleCocedorProceso]', err);
    return null;
  }
}

export const validarHoraXHora = async (payload) => {
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/validar-supervisor`, 'POST', JSON.stringify(payload));
    return res;
  } catch (e) {
    console.error(`Error al validar hora x hora`, e);
    return { error: "Error al validar hora x hora" }
  }
}


export const finalizarMezcla = async (payload) => {
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/finalizar-mezcla`, 'POST', JSON.stringify(payload));
    return res;
  }catch(e){
    console.error(`Error al finalizar proceso en cocedores`, e);
    return { error: "Error al finalizar proceso en cocedores"};
  }
}

export const obtenerMezclaEnProceso = async() =>  { 
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/obtener-mezcla-en-proceso`);
    return res;
  } catch (err) {
    console.error('[obtenerMezclaEnProceso]', err);
    return null;
  }
}

export const obtenerMezclaById = async (id) => {
  try {
    const res = await fetchApi(`${FUNCIONES}/cocedores/obtener-mezcla-by-id/${id}`);
    return res;
  } catch (err) {
    console.error('[obtenerMezclaById]', err);
    return null;
  }
}

export const obtenerReporte = async (payload) => {
  try {
    const res = await fetchApi(`${REPORTES}/cocedores`, 'POST', JSON.stringify(payload));
    return res;
  }catch(e){
    console.error(`Error al obtener reporte`, e);
    return { error: "Error al obtener reporte"};
  }
}