// Renderiza el <ul> del sidebar y marca activo según el hash
import { ROUTES } from '../router/routes.js';

export function renderSidebar(targetSelector = '#sidebar .nav.flex-column') {
  const ul = document.querySelector(targetSelector);
  if (!ul) return;

  const items = ROUTES.map(r => `
    <li class="nav-item">
      <a class="nav-link menu-item" href="#${r.path}" data-route="${r.path}">
        <i data-lucide="${r.icon}"></i><span>${r.title}</span>
        <div class="nav-link-active-indicator"></div>
      </a>
    </li>
  `).join('');

  ul.innerHTML = items;
  setActiveSidebar(getRouteFromHash());
}

export function setActiveSidebar(route, targetSelector = '#sidebar .nav.flex-column') {
  const ul = document.querySelector(targetSelector);
  if (!ul) return;
  const currentHref = `#${route}`;
  ul.querySelectorAll('.nav-link').forEach(a => {
    const active = a.getAttribute('href') === currentHref;
    a.classList.toggle('active', active);
    a.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

export function getRouteFromHash(defaultRoute) {
  const h = (location.hash || '').replace(/^#/, '');
  return h || defaultRoute;
}
