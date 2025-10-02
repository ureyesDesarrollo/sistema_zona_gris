export const fetchApi = async (url, method = 'GET', body = null) => {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body
    });
    let json = {};
    try { json = await res.json(); } catch { /* sin cuerpo */ }

    // Estructura unificada
    const base = {
      success: res.ok && json?.success !== false,
      status: res.status,
      error: null,
      errors: null,
      data: null,
      raw: json
    };

    if (!base.success) {
      base.error = json?.error || json?.message || res.statusText || "Error en la solicitud";
      base.errors = json?.errors || null; // { campo: [mensajes] }
      return base;
    }

    base.data = json?.data ?? json;
    return base;
  } catch (e) {
    console.error('Error de red o CORS:', e);
    return { success: false, status: 0, error: "Error de red o CORS", errors: null, data: null };
  }
};


/**
 * Procesa la respuesta de la API y lanza un error con un mensaje descriptivo si falla.
 * Esto evita la duplicación de código en cada función de acción.
 * @param {object} res La respuesta de la API.
 * @param {string} defaultMsg Mensaje de error por defecto.
 */
export const handleServiceResponse = (res, defaultMsg = "Ocurrió un error") => {
  const isArray = Array.isArray(res);
  const isObject = typeof res === 'object' && res !== null && !isArray;

  // Casos válidos: array, o objeto con ok/success/data positivo
  const isSuccess =
    isArray ||
    (isObject && (
      res.ok === true ||
      res.success === true ||
      (res.data !== undefined && res.data !== null)
    ));

  if (isSuccess) return;

  console.error("❌ Error en respuesta del servicio:", res);

  let errorMsg = defaultMsg;

  if (isObject) {
    // Errores tipo objeto
    if (res.errors) {
      if (typeof res.errors === 'object') {
        errorMsg = Object.entries(res.errors)
          .map(([field, msgs]) => `• ${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
          .join("<br>");
      } else if (typeof res.errors === 'string') {
        errorMsg = res.errors;
      }
    }

    // Error simple
    else if (res.error) {
      errorMsg = res.error;
    }

    // Mensaje genérico
    else if (res.message) {
      errorMsg = res.message;
    }
  }

  throw new Error(errorMsg);
};