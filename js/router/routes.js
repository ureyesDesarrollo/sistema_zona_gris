// js/routes.js
export const DEFAULT_ROUTE = '/dashboard/cocedores';
export const VIEW_404 = 'pages/404.html';

export const ROUTES = [
  { path: '/dashboard/cocedores', 
    url: 'views/cocedores.html', 
    title: 'Cocedores',     
    icon: 'flame', 
    permission: 'cocedores:listar', 
    module: '../pages/cocedores.js' },

  { path: '/dashboard/clarificador', 
    url: 'views/clarificador.html', 
    title: 'Clarificador',  
    icon: 'funnel',    
    permission: 'zona_gris:clarificador:view', 
    module: '../pages/clarificador.js' },

  { path: '/dashboard/configuracion', 
    url: 'views/configuracion.html', 
    title: 'Configuración', 
    icon: 'cog',       
    permission: 'admin:config:view', 
    module: '../pages/configuracion.js' },
];

// Si manejas permisos por usuario (localStorage.usuario.permisos = []), filtra:
export function filterRoutesByUser(user) {
  const grants = user?.permisos || user?.roles || [];
  const has = (perm) => !perm || (Array.isArray(grants) && (grants.includes(perm) || grants.includes('*')));
  return ROUTES.filter(r => has(r.permission));
}
