export const tienePermiso = (modulo, permiso) => {
    const { permisos } = JSON.parse(localStorage.getItem('usuario') || 'null');
    return permisos?.[modulo]?.includes(permiso) || false;
};