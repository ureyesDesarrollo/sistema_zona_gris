// js/components/sidebar.js
import { ROUTES } from '../router/routes.js';

// Elementos del DOM consultados solo una vez para mejor rendimiento
const sidebarNavElement = document.querySelector('#sidebar .nav.flex-column');

/**
 * Obtiene la ruta actual del hash de la URL.
 * @returns {string} La ruta actual sin el "#".
 */
const getRouteFromHash = () => {
  return location.hash.substring(1);
};

/**
 * Renderiza el menú del sidebar a partir de las rutas disponibles.
 */
export function renderSidebar() {
  if (!sidebarNavElement) return;

  const items = ROUTES.map(route => `
    <li class="nav-item">
      <a class="nav-link menu-item" href="#${route.path}" data-route="${route.path}">
        <i data-lucide="${route.icon}"></i><span>${route.title}</span>
        <div class="nav-link-active-indicator"></div>
      </a>
    </li>
  `).join('');

  sidebarNavElement.innerHTML = items;
  setActiveSidebar(getRouteFromHash());
}

/**
 * Establece la clase 'active' en el elemento del sidebar que corresponde a la ruta actual.
 * @param {string} route La ruta actual para marcar como activa.
 */
export function setActiveSidebar(route) {
  if (!sidebarNavElement) return;
  
  // Optimizamos seleccionando solo los elementos de enlace una vez
  const navLinks = sidebarNavElement.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const isActive = link.getAttribute('data-route') === route;
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}