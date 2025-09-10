// js/index.js
import { renderTimer, SESSION_DURATION_MS, startInactivityTimer, startTick, attachActivityListeners, logout } from './components/sessionTimer.js';
import { startRouter } from './router/router.js';
import { renderSidebar } from './components/sidebar.js';
import { BASE_API } from './config.js';
import { getUser } from './utils/auth.js';
import { debounce } from './utils/debounce.js';

// ================ UTILIDADES ========================= //
/**
 * Actualiza la UI con la información del perfil del usuario.
 * @param {object} user - El objeto de usuario.
 */
const updateProfileUI = (user) => {
  if (!user) return;
  const { usuario_nombre, perfil } = user;
  const iniciales = usuario_nombre
    ? usuario_nombre.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
    : '';

  const userAvatarEl = document.getElementById('userAvatar');
  const nombreUsuarioEl = document.getElementById('nombre-usuario');
  const perfilUsuarioEl = document.getElementById('perfil-usuario');

  if (userAvatarEl) userAvatarEl.textContent = iniciales;
  if (nombreUsuarioEl) nombreUsuarioEl.textContent = usuario_nombre;
  if (perfilUsuarioEl) perfilUsuarioEl.textContent = perfil;
};

/**
 * Obtiene el perfil del usuario desde la API y lo actualiza en el almacenamiento local y la UI.
 * @param {object} user - El objeto de usuario con al menos user_id.
 * @returns {Promise<boolean>} Devuelve true si la operación fue exitosa, de lo contrario false.
 */
const fetchAndSetProfile = async (user) => {
  if (!user?.user_id) return false;

  try {
    const res = await fetch(`${BASE_API}/perfil/${user.user_id}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    if (data?.error) throw new Error(data.error);

    localStorage.setItem('usuario', JSON.stringify(data));
    updateProfileUI(data);
    return true;
  } catch (err) {
    console.error('[getPerfil] Error:', err);
    logout({ manual: true });
    return false;
  }
};

// ================ INICIALIZACIÓN PRINCIPAL ========================= //

document.addEventListener('DOMContentLoaded', async () => {
  const user = getUser();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  // Carga y verificación del perfil
  const profileOk = await fetchAndSetProfile(user);
  if (!profileOk) return;

  // Renderizado inicial de la UI
  renderSidebar();
  startRouter();

  // Gestión de la sesión y el temporizador
  renderTimer(SESSION_DURATION_MS);
  startInactivityTimer();
  attachActivityListeners();
  startTick();

  // Event listener para el botón de cerrar sesión
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.setItem('logout', 'true');
      logout({ manual: true });
    });
  }

  // --- Integración de Lucide Icons ---

  const debouncedCreateIcons = debounce(() => window.lucide?.createIcons());

  // Observador para nodos nuevos que contengan iconos de Lucide
  const observer = new MutationObserver(mutations => {
    const needsUpdate = mutations.some(m =>
      [...m.addedNodes].some(n =>
        n.nodeType === 1 && (n.matches?.('[data-lucide]') || n.querySelector?.('[data-lucide]'))
      )
    );
    if (needsUpdate) {
      debouncedCreateIcons();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Disparo inicial y después de un breve retraso para asegurar que el router ha pintado
  debouncedCreateIcons();
});