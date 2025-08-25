import { api } from './apiClient.js';

/**
 * Servicio de autenticación para el sistema de citas médicas
 * Maneja login, logout, registro y gestión de tokens JWT
 */

/**
 * Iniciar sesión
 * @param {object} credentials - { email, password }
 * @returns {Promise<object>} { user, token, role }
 */
export const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);

    // Guardar token y datos del usuario en localStorage
    if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('role', response.user.role);
    }

    return response;
};

/**
 * Cerrar sesión
 */
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');

    // Redirigir al login si estamos en el dashboard
    if (window.location.pathname.startsWith('/dashboard')) {
        window.location.href = '/dashboard/login';
    }
};

/**
 * Registrar nuevo usuario (solo pacientes públicos)
 * @param {object} userData - { name, email, password }
 * @returns {Promise<object>}
 */
export const register = async (userData) => {
    const response = await api.post('/auth/register', userData);

    // Auto-login después del registro
    if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('role', response.user.role);
    }

    return response;
};

/**
 * Obtener perfil del usuario actual
 * @returns {Promise<object>}
 */
export const getProfile = async () => {
    return await api.get('/auth/me');
};

/**
 * Actualizar perfil del usuario actual
 * @param {object} profileData 
 * @returns {Promise<object>}
 */
export const updateProfile = async (profileData) => {
    const response = await api.patch('/auth/me', profileData);

    // Actualizar datos locales
    if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
};

/**
 * Cambiar contraseña
 * @param {object} passwordData - { currentPassword, newPassword }
 * @returns {Promise<object>}
 */
export const changePassword = async (passwordData) => {
    return await api.patch('/auth/password', passwordData);
};

/**
 * Verificar si el usuario está autenticado
 * @returns {boolean}
 */
export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
};

/**
 * Obtener token actual
 * @returns {string|null}
 */
export const getToken = () => {
    return localStorage.getItem('token');
};

/**
 * Obtener datos del usuario actual desde localStorage
 * @returns {object|null}
 */
export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Error parsing user data:', error);
            logout();
            return null;
        }
    }
    return null;
};

/**
 * Obtener rol del usuario actual
 * @returns {string|null}
 */
export const getCurrentRole = () => {
    return localStorage.getItem('role');
};

/**
 * Verificar si el usuario tiene un rol específico
 * @param {string|string[]} roles - Rol o array de roles permitidos
 * @returns {boolean}
 */
export const hasRole = (roles) => {
    const currentRole = getCurrentRole();
    if (!currentRole) return false;

    if (Array.isArray(roles)) {
        return roles.includes(currentRole);
    }

    return currentRole === roles;
};

/**
 * Verificar si el usuario es admin
 * @returns {boolean}
 */
export const isAdmin = () => {
    return hasRole('admin');
};

/**
 * Verificar si el usuario es operador (o admin)
 * @returns {boolean}
 */
export const isOperador = () => {
    return hasRole(['admin', 'operador']);
};

/**
 * Verificar si el usuario es doctor
 * @returns {boolean}
 */
export const isDoctor = () => {
    return hasRole('doctor');
};

/**
 * Verificar si el usuario es paciente
 * @returns {boolean}
 */
export const isPaciente = () => {
    return hasRole('paciente');
};

/**
 * Verificar si el token ha expirado
 * @returns {boolean}
 */
export const isTokenExpired = () => {
    const token = getToken();
    if (!token) return true;

    try {
        // Decodificar JWT sin verificar (solo para obtener exp)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;

        return payload.exp < currentTime;
    } catch (error) {
        console.error('Error decoding token:', error);
        return true;
    }
};

/**
 * Renovar token automáticamente
 * @returns {Promise<boolean>}
 */
export const refreshToken = async () => {
    try {
        const response = await api.post('/auth/refresh');

        if (response.token) {
            localStorage.setItem('token', response.token);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error refreshing token:', error);
        logout();
        return false;
    }
};

/**
 * Verificar estado de autenticación y validez del token
 * @returns {Promise<boolean>}
 */
export const validateAuth = async () => {
    if (!isAuthenticated()) {
        return false;
    }

    if (isTokenExpired()) {
        // Intentar renovar token
        const renewed = await refreshToken();
        if (!renewed) {
            logout();
            return false;
        }
    }

    try {
        // Verificar que el perfil sea accesible
        await getProfile();
        return true;
    } catch (error) {
        logout();
        return false;
    }
};

/**
 * Solicitar recuperación de contraseña
 * @param {string} email 
 * @returns {Promise<object>}
 */
export const requestPasswordReset = async (email) => {
    return await api.post('/auth/forgot-password', { email });
};

/**
 * Restablecer contraseña con token
 * @param {object} resetData - { token, newPassword }
 * @returns {Promise<object>}
 */
export const resetPassword = async (resetData) => {
    return await api.post('/auth/reset-password', resetData);
};

/**
 * Configurar interceptor para renovación automática de token
 */
export const setupTokenRenewal = () => {
    // Verificar token cada 5 minutos
    setInterval(async () => {
        if (isAuthenticated() && isTokenExpired()) {
            console.log('🔄 Token expirado, renovando...');
            await refreshToken();
        }
    }, 5 * 60 * 1000);
};

/**
 * Estados de autenticación para el contexto
 */
export const AuthStates = {
    CHECKING: 'checking',
    AUTHENTICATED: 'authenticated',
    UNAUTHENTICATED: 'unauthenticated',
    ERROR: 'error'
};

export default {
    login,
    logout,
    register,
    getProfile,
    updateProfile,
    changePassword,
    isAuthenticated,
    getToken,
    getCurrentUser,
    getCurrentRole,
    hasRole,
    isAdmin,
    isOperador,
    isDoctor,
    isPaciente,
    isTokenExpired,
    refreshToken,
    validateAuth,
    requestPasswordReset,
    resetPassword,
    setupTokenRenewal,
    AuthStates
};
