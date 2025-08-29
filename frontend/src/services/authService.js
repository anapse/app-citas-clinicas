import api from './api';

export const authService = {
    // Iniciar sesión
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.usuario));
        }
        return response.data;
    },

    // Cerrar sesión
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Obtener perfil del usuario
    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },

    // Cambiar contraseña
    changePassword: async (currentPassword, newPassword) => {
        const response = await api.put('/auth/change-password', {
            currentPassword,
            newPassword
        });
        return response.data;
    },

    // Verificar token
    verifyToken: async () => {
        const response = await api.get('/auth/verify');
        return response.data;
    },

    // Obtener usuario del localStorage
    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Verificar si está autenticado
    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    }
};
