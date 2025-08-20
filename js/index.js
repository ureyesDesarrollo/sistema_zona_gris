// js/index.js
import { renderTimer, SESSION_DURATION_MS, startInactivityTimer, startTick, attachActivityListeners, logout } from './components/sessionTimer.js';
import { startRouter } from './router/router.js';
import { renderSidebar } from './components/sidebar.js';
import { BASE_API } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(localStorage.getItem('usuario') || 'null');
  if (!user) {
    window.location.href = 'index.html';
  }

  const ok = await getPerfil(user);
  if (!ok) return;

  renderSidebar();
  startRouter(); // ← aquí tu router inyecta la primera vista

  // ✅ Pase inicial: reemplaza cualquier [data-lucide] ya presente en DOM
  window.lucide?.createIcons();

  renderTimer(SESSION_DURATION_MS);
  startInactivityTimer();
  attachActivityListeners();
  startTick();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.setItem('logout', 'true');
      logout({ manual: true });
    });
  }

  // Debounce util
  const debounced = (() => {
    let t;
    return (fn, wait = 50) => { clearTimeout(t); t = setTimeout(fn, wait); };
  })();

  // 🔁 Disparo inicial por si el router terminó de pintar un instante después
  debounced(() => window.lucide?.createIcons(), 0);

  // Observer para contenido dinámico (modales, inserts tardíos, etc.)
  const observer = new MutationObserver(muts => {
    for (const m of muts) {
      const needs = [...m.addedNodes].some(n =>
        n?.nodeType === 1 && (n.matches?.('[data-lucide]') || n.querySelector?.('[data-lucide]'))
      );
      if (needs) {
        debounced(() => window.lucide?.createIcons());
        break;
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
});

// ================ PERFIL ========================= //
async function getPerfil(user) {
  if (!user) return false;
  try {
    const res = await fetch(`${BASE_API}/perfil/${user.user_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const raw = await res.text();
    const data = raw ? JSON.parse(raw) : {};

    if (!res.ok || data?.error) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    perfil(data);
    localStorage.setItem('usuario', JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('[getPerfil] ', err);
    logout({ manual: true });
    return false;
  }
}

function perfil(user) {
  if (!user) return false;
  const iniciales = user?.usuario_nombre
    ? user.usuario_nombre.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
    : '';
  document.getElementById('userAvatar').textContent = iniciales;
  document.getElementById('nombre-usuario').textContent = user.usuario_nombre;
  document.getElementById('perfil-usuario').textContent = user.perfil;
}
