export const fetchApi = async (url, method = 'GET', body = null) => {
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json'},
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
        base.error  = json?.error || json?.message || res.statusText || "Error en la solicitud";
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
  