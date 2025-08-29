const getUserId = () => {
    try {
        const u = JSON.parse(localStorage.getItem('usuario') || 'null');
        return u?.user_id ?? u?.id ?? null;
    } catch { return null; }
};

const getPerfilNombre = (user) => (user?.perfil ?? '').toString().trim().toLowerCase();

const isAdminOrGerente = (user) => {
    const p = getPerfilNombre(user);
    return p === 'admin' || p === 'administrador' || p === 'gerente zona gris';
};

const isSupervisor = (user) => getPerfilNombre(user) === 'supervisor extraccion';
const isControlProcesos = (user) => getPerfilNombre(user) === 'laboratorio';

const tienePermiso = (modulo, permiso) => {
    const { permisos } = JSON.parse(localStorage.getItem('usuario') || 'null');
    return permisos?.[modulo]?.includes(permiso) || false;
};

export { getPerfilNombre, isAdminOrGerente, isSupervisor, isControlProcesos, tienePermiso, getUserId };
