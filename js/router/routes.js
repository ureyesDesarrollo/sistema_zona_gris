// js/routes.js

// Define una ruta por defecto y la página de error 404.
export const DEFAULT_ROUTE = '/dashboard/cocedores';
export const VIEW_404 = 'views/404.html';
export const ROUTES = [
  { 
    path: '/dashboard/cocedores',
    url: 'views/cocedores.html',
    title: 'Cocedores',
    icon: 'flame',
    module: '../pages/cocedores/cocedores.js',
    permission: 'Cocedores.listar' // Ejemplo: permiso para listar la vista de cocedores
  },
  { 
    path: '/dashboard/clarificador',
    url: 'views/clarificador.html',
    title: 'Clarificador',
    icon: 'funnel',
    module: '../pages/clarificador/clarificador.js',
    permission: 'Clarificador.listar' // Ejemplo: permiso para listar la vista de clarificador
  },
  { 
    path: '/dashboard/configuracion',
    url: 'views/configuracion.html',
    title: 'Configuración',
    icon: 'cog',
    module: '../pages/configuracion.js',
    permission: 'Configuración.listar' // Ejemplo: permiso para listar la vista de configuración
  },
  // ... (Agrega otros permisos a las rutas según tus necesidades) ...
];

/**
 * Verifica si un usuario tiene un permiso específico dentro de un módulo.
 * @param {Object} userPermissions - El objeto de permisos del usuario.
 * @param {string} requiredPermission - El permiso requerido en formato "Modulo.accion".
 * @returns {boolean} True si el usuario tiene el permiso, de lo contrario, false.
 */
const hasPermission = (userPermissions, requiredPermission) => {
  // Manejo de casos de permisos no definidos o usuario no logueado
  if (!userPermissions || !requiredPermission) {
    return false;
  }

  // Si el usuario es un administrador, tiene acceso completo
  if (userPermissions['*'] && userPermissions['*'].includes('*')) {
    return true;
  }

  // Separa el módulo y la acción del permiso requerido
  const [module, action] = requiredPermission.split('.');

  // Obtiene los permisos para el módulo específico
  const modulePermissions = userPermissions[module];

  // Verifica si el módulo existe y si el array de acciones contiene la acción requerida
  return Array.isArray(modulePermissions) && (modulePermissions.includes(action) || modulePermissions.includes('*'));
};

/**
 * Filtra las rutas del menú de navegación basándose en los permisos del usuario.
 * @param {Object} user - El objeto del usuario con sus permisos.
 * @returns {Array<Object>} Un array de rutas a las que el usuario está autorizado a acceder.
 */
export function filterRoutesByUser(user) {
  // Si el usuario no existe, no hay permisos que validar
  if (!user) {
    return [];
  }

  const userPermissions = user?.permisos || {};

  return ROUTES.filter(route => {
    // Si la ruta no requiere un permiso, siempre se muestra
    if (!route.permission) {
      return true;
    }

    return hasPermission(userPermissions, route.permission);
  });
}