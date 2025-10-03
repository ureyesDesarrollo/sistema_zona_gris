import { showToast } from "../components/toast.js";

/**
* Ejecuta una acción de forma segura, previniendo múltiples clics.
* Se encarga de la deshabilitación del botón y el manejo de errores global.
* @param {HTMLElement} btn El botón que activa la acción.
* @param {function} reloadFn La función para recargar la UI.
* @param {function} actionFn La función asíncrona que realiza la lógica de la acción.
*/
const runAction = async (btn, reloadFn, actionFn) => {
   // Previene múltiples clics mientras la acción está en curso.
   if (btn.hasAttribute("data-in-flight")) return;

   btn.setAttribute("data-in-flight", "1");
   btn.disabled = true;

   try {
       await actionFn();
       // Recarga la UI solo si la acción fue exitosa.
       if (typeof reloadFn === "function") {
           await reloadFn();
       }
   } catch (error) {
       console.error("Error en la acción:", error);
       // Muestra un toast de error con el mensaje capturado.
       showToast(error.message || "Ocurrió un error inesperado.", "error");
   } finally {
       // Restaura el estado del botón.
       btn.disabled = false;
       btn.removeAttribute("data-in-flight");
   }
};

export default runAction;
