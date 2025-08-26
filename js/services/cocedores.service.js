import { FUNCIONES_COCEDORES, CATALOGOS_COCEDORES, BASE_API } from "../config.js";
import { fetchApi } from "../utils/api.js"
import { getLocalDateTimeString } from "../utils/getLocalDateTimeString.js";

export async function fetchCocedores() {
  
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/estado`);
    if (!res.success) throw new Error(res.error);
    return res.data;
  } catch (err) {
    console.error('[fetchCocedores]', err);
    return null;
  }
}

export async function fetchProximaRevision() {
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/proxima-revision`);
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
    const res = await fetchApi(`${CATALOGOS_COCEDORES}/${id}/estatus`, 'PUT', JSON.stringify({ estatus }));
    if (!res.success) throw new Error(res.error);
    return res.data;
  } catch (e) {
    console.error(`Error en changeStatus del cocedor ${id} a ${estatus}`, e);
    return { error: "Error al cambiar estatus de cocedor" }
  }
};

export const registrarParo = async (payload) => {
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/paro`, 'POST', JSON.stringify(payload));
    if (!res.success) throw new Error(res.error);
    return res.data;
  } catch (e) {
    console.error(`Error en registrarParo del cocedor ${payload.id}`, e);
    return { error: "Error al registrar paro de cocedor" }
  }
};

export const finalizarParo = async (payload) => {
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/finalizar-paro`, 'POST', JSON.stringify(payload));
    if (!res.success) throw new Error(res.error);
    return res;
  } catch (e) {
    console.error(`Error en finalizarParo del cocedor ${payload.id}`, e);
    return { error: "Error al finalizar paro de cocedor" }
  }
};


export const fetchProcesos = async () => {
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/procesos-disponibles`);
    if (!res.success) throw new Error(res.error);
    return res.data;
  } catch (err) {
    console.error('[fetchProcesos]', err);
    return null;
  }
}

export async function iniciarProcesos(payload) {
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/combinar-procesos`, 'POST', JSON.stringify(payload));
    if (!res.success) throw new Error(res.error);
    return res.data;
  } catch (e) {
    console.error(`Error al iniciar procesos`, e);
    return { error: "Error al iniciar procesos" }
  }
}

export const obtenerCocedoresProcesoById = async (id) => {
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/obtener-cocedores-proceso-by-id/${id}`);
    if (!res.success) throw new Error(res.error);
    return res.data;
  } catch (err) {
    console.error('[obtenerCocedoresProceso]', err);
    return null;
  }
}

export const obtenerFlujos = async () => {
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/obtener-flujo`);
    if (!res.success) throw new Error(res.error);
    return res.data;
  } catch (err) {
    console.error('[obtenerFlujos]', err);
    return null;
  }
}

export const obtenerTemperaturaCocedores = async () => {
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/obtener-temperatura`);
    if (!res.success) throw new Error(res.error);
    return res.data[0];
  } catch (err) {
    console.error('[obtenerTemperaturaCocedores]', err);
    return null;
  }
}

export const vaidarConsecutividadHoraXHora = async (id) => {
  try {
    const now = new Date();
  const fechaHora = getLocalDateTimeString(now);
    console.log(fechaHora);
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/validar-consecutividad/${id}/${fechaHora}`);
    if (!res.success) throw new Error(res.error);
    return res.data;
  } catch (err) {
    console.error('[vaidarConsecutividadHoraXHora]', err);
    return null;
  }
}

export const registrarHoraXHora = async (payload) => {
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/registro-horario`, 'POST', JSON.stringify(payload));
    return res;
  } catch (e) {
    console.error(`Error al registrar hora x hora`, e);
    return { error: "Error al registrar hora x hora" }
  }
}

export const obtenerDetelleCocedorProceso = async (id) => {
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/obtener-detalle-cocedor-proceso/${id}`);
    if (!res.success) throw new Error(res.error);
    return res.data[0];
  } catch (err) {
    console.error('[obtenerDetelleCocedorProceso]', err);
    return null;
  }
}

export const validarHoraXHora = async (payload) => {
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/validar-supervisor`, 'POST', JSON.stringify(payload));
    return res;
  } catch (e) {
    console.error(`Error al validar hora x hora`, e);
    return { error: "Error al validar hora x hora" }
  }
}


export const finalizarMezcla = async (payload) => {
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/finalizar-mezcla`, 'POST', JSON.stringify(payload));
    return res;
  }catch(e){
    console.error(`Error al finalizar proceso en cocedores`, e);
    return { error: "Error al finalizar proceso en cocedores"};s
  }
}

export const obtenerMezclaEnProceso = async() =>  { 
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/obtener-mezcla-en-proceso`);
    if (!res.success) throw new Error(res.error);
    return res.data;
  } catch (err) {
    console.error('[obtenerMezclaEnProceso]', err);
    return null;
  }
}

export const obtenerMezclaById = async (id) => {
  try {
    const res = await fetchApi(`${FUNCIONES_COCEDORES}/obtener-mezcla-by-id/${id}`);
    if (!res.success) throw new Error(res.error);
    return res.data;
  } catch (err) {
    console.error('[obtenerMezclaById]', err);
    return null;
  }
}

export const alerta = async (payload) => {
  try {
    const res = await fetch(`${BASE_API}/alertas/enviar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(res.statusText);
    return res;
  }catch(e){
    console.error(`Error al enviar alerta`, e);
    return { error: "Error al enviar alerta"};
  }
}