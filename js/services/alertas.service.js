import { BASE_API } from "../config.js";

export const alerta = async (payload) => {
    try {
      const res = await fetch(`${BASE_API}/alertas/enviar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      return res;
    }catch(e){
      console.error(`Error al enviar alerta`, e);
      return { error: "Error al enviar alerta"};
    }
  }