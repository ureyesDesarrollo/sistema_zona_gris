// js/router/router.js
import { ROUTES, DEFAULT_ROUTE } from './routes.js';
import { setActiveSidebar } from '../components/sidebar.js';

const ROUTE_MAP = new Map(ROUTES.map(r => [r.path, r]));

async function cargarContenido(url) {
  const container = document.getElementById('container');
  if (!container) return;
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    container.innerHTML = await res.text();
  } catch (e) {
    container.innerHTML = `<div class="alert alert-danger m-3">Error al cargar la página: ${e.message}</div>`;
  }
}

function getRouteFromHash() {
  const h = (location.hash || '').replace(/^#/, '');
  return h || DEFAULT_ROUTE;
}

export async function navigate() {
  const route = getRouteFromHash();
  setActiveSidebar(route);

  const record = ROUTE_MAP.get(route);
  await cargarContenido(record?.url || 'pages/404.html');

  // Hook por página (opcional):
  if (record?.module) {
    try { 
      const mod = await import(record.module);
      mod.init?.();
    } catch (e) { 
      console.error(e); 
    }
  }

  // ✅ Reemplazar íconos lucide después de inyectar la vista y correr init()
  window.lucide?.createIcons();

  // (Si prefieres evento en lugar de la línea anterior:)
  // document.dispatchEvent(new CustomEvent('view:rendered'));

  window.closeMobile?.();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function startRouter() {
  // Escucha cambios de hash
  window.addEventListener('hashchange', navigate);

  // Si no hay hash al entrar, coloca el de DEFAULT sin crear entrada en el historial
  if (!location.hash) {
    location.replace(`#${DEFAULT_ROUTE}`);
  } else {
    // Si ya hay hash, navega de inmediato
    navigate();
  }
}
