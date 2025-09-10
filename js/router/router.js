// js/router/router.js

import { ROUTES, DEFAULT_ROUTE, VIEW_404 } from './routes.js';
import { setActiveSidebar } from '../components/sidebar.js';

/**
 * Un mapa que proporciona un acceso rápido a las rutas por su path.
 * Usar un mapa es más eficiente que buscar en un array.
 */
const ROUTE_MAP = new Map(ROUTES.map(r => [r.path, r]));

/**
 * Carga el contenido de una vista desde una URL y lo inyecta en el contenedor principal.
 * @param {string} url La URL de la vista a cargar.
 */
async function loadView(url) {
  const container = document.getElementById('container');
  if (!container) {
    console.error('No se encontró el contenedor con ID "container".');
    return;
  }
  
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    container.innerHTML = await response.text();
  } catch (error) {
    console.error('Error al cargar la página:', error);
    container.innerHTML = `<div class="alert alert-danger m-3">Error al cargar la página: ${error.message}</div>`;
  }
}

/**
 * Carga dinámicamente el módulo JavaScript asociado a la ruta actual e inicializa la página.
 * @param {string | undefined} modulePath La ruta al módulo JavaScript.
 */
async function loadModule(modulePath) {
  if (!modulePath) return;

  try {
    const module = await import(modulePath);
    // Llama al método 'init' si existe en el módulo.
    module.init?.();
  } catch (error) {
    console.error(`Error al cargar o inicializar el módulo ${modulePath}:`, error);
  }
}

/**
 * Maneja la navegación y renderiza la vista y su lógica asociada.
 * Este es el punto de entrada principal del enrutador.
 */
export async function navigate() {
  const hash = location.hash.replace(/^#/, '');
  const route = hash || DEFAULT_ROUTE;
  const routeRecord = ROUTE_MAP.get(route);
  
  // 1. Cargar la vista y el módulo asociado
  // Usa la ruta de 404 si la ruta no existe en el mapa
  await loadView(routeRecord?.url || VIEW_404);
  await loadModule(routeRecord?.module);

  // 2. Actualizar la UI
  setActiveSidebar(route);
  // Reemplaza los íconos de Lucide Icons después de inyectar el HTML
  window.lucide?.createIcons();
  
  // 3. Limpiar y ajustar la página
  window.closeMobile?.();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Inicia el enrutador escuchando los cambios en el hash y manejando la carga inicial.
 */
export function startRouter() {
  // Maneja la navegación inicial para la ruta por defecto
  if (!location.hash) {
    location.replace(`#${DEFAULT_ROUTE}`);
  } else {
    navigate();
  }

  // Escucha los cambios de hash para navegar
  window.addEventListener('hashchange', navigate);
}