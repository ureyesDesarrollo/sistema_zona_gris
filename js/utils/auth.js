import { BASE_API } from '../config.js';

//Obtiene el usuario desde el localStorage
export const getUser = () => JSON.parse(localStorage.getItem('usuario') || 'null');

//Guarda el usario en el localStorage
export const saveUser = (user) => localStorage.setItem('usuario', JSON.stringify(user));

//Elimina la sesion
export const logout = ({manual = false} = {}) => {
    localStorage.removeItem('usuario');
    if(manual) localStorage.setItem('logout', 'true');
    window.location.href = 'index.html';
}

//Obtiene el perfil actualizado desde el backend

export const fetchUserProfile = async (userId) => {
    try{
        const response = await fetch(`${BASE_API}/perfil/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type' : 'application/json'}
        });

        const raw = await response.text();
        const data = raw ? JSON.parse(raw) : {};
        
        if(!response.ok || data?.error) throw new Error(data?.error || `HTTP ${response.status}`);
        return data;
    } catch (error) {
        console.error('[fetchUserProfile] ', error);
        throw error;
    }
};