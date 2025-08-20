/**
 * Obtiene el ID del usuario autenticado almacenado en localStorage.
 * @returns {number|string|null}
 */
export const getUserId = () => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    return usuario?.user_id ?? usuario?.id ?? null;
};
