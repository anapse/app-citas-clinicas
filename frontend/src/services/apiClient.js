import axios from 'axios';

/**
 * Cliente API configurado para el sistema de citas médicas
 * Maneja autenticación, interceptores y errores globalmente
 */

// Configuración base del cliente
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Interceptor de peticiones - Agregar token JWT automáticamente
 */
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log de peticiones en desarrollo
        if (import.meta.env.DEV) {
            console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
                data: config.data,
                params: config.params
            });
        }

        return config;
    },
    (error) => {
        console.error('❌ Error en interceptor de petición:', error);
        return Promise.reject(error);
    }
);

/**
 * Interceptor de respuestas - Manejo de errores globales
 */
apiClient.interceptors.response.use(
    (response) => {
        // Log de respuestas exitosas en desarrollo
        if (import.meta.env.DEV) {
            console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
        }

        return response;
    },
    (error) => {
        // Log de errores
        console.error('❌ Error en respuesta API:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            data: error.response?.data
        });

        // Manejo de errores específicos
        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    // Token expirado o inválido - logout automático
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/dashboard/login';
                    break;

                case 403:
                    // Sin permisos
                    console.error('❌ Sin permisos para esta acción');
                    break;

                case 409:
                    // Conflicto - manejar en el componente específico
                    console.warn('⚠️ Conflicto:', data?.message || data?.error);
                    break;

                case 422:
                    // Errores de validación - manejar en el componente
                    console.warn('⚠️ Errores de validación:', data?.errors);
                    break;

                case 429:
                    // Rate limiting
                    console.warn('⚠️ Demasiadas peticiones, intenta de nuevo más tarde');
                    break;

                case 500:
                    // Error del servidor
                    console.error('❌ Error interno del servidor');
                    break;

                default:
                    console.error(`❌ Error ${status}:`, data?.message || error.message);
            }

            // Personalizar el error para mejor manejo en componentes
            const customError = new Error(data?.message || data?.error || error.message);
            customError.status = status;
            customError.code = data?.code;
            customError.errors = data?.errors;

            return Promise.reject(customError);
        } else if (error.request) {
            // Error de red
            console.error('❌ Error de red:', error.message);
            const networkError = new Error('Error de conexión. Verifica tu conexión a internet.');
            networkError.status = 0;
            networkError.code = 'NETWORK_ERROR';
            return Promise.reject(networkError);
        } else {
            // Error de configuración
            console.error('❌ Error de configuración:', error.message);
            return Promise.reject(error);
        }
    }
);

/**
 * Métodos helper para diferentes tipos de peticiones
 */
export const api = {
    /**
     * GET request
     * @param {string} url 
     * @param {object} config 
     * @returns {Promise}
     */
    get: async (url, config = {}) => {
        const response = await apiClient.get(url, config);
        return response.data;
    },

    /**
     * POST request
     * @param {string} url 
     * @param {object} data 
     * @param {object} config 
     * @returns {Promise}
     */
    post: async (url, data = {}, config = {}) => {
        const response = await apiClient.post(url, data, config);
        return response.data;
    },

    /**
     * PUT request
     * @param {string} url 
     * @param {object} data 
     * @param {object} config 
     * @returns {Promise}
     */
    put: async (url, data = {}, config = {}) => {
        const response = await apiClient.put(url, data, config);
        return response.data;
    },

    /**
     * PATCH request
     * @param {string} url 
     * @param {object} data 
     * @param {object} config 
     * @returns {Promise}
     */
    patch: async (url, data = {}, config = {}) => {
        const response = await apiClient.patch(url, data, config);
        return response.data;
    },

    /**
     * DELETE request
     * @param {string} url 
     * @param {object} config 
     * @returns {Promise}
     */
    delete: async (url, config = {}) => {
        const response = await apiClient.delete(url, config);
        return response.data;
    },

    /**
     * Upload de archivos
     * @param {string} url 
     * @param {FormData} formData 
     * @param {object} config 
     * @returns {Promise}
     */
    upload: async (url, formData, config = {}) => {
        const response = await apiClient.post(url, formData, {
            ...config,
            headers: {
                ...config.headers,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};

/**
 * Utilidades para manejo de errores en componentes
 */
export const handleApiError = (error, defaultMessage = 'Ha ocurrido un error') => {
    if (error.status === 409) {
        // Conflictos específicos del dominio médico
        return error.message;
    } else if (error.status === 422 && error.errors) {
        // Errores de validación
        const firstError = Object.values(error.errors)[0];
        return Array.isArray(firstError) ? firstError[0] : firstError;
    } else if (error.code === 'NETWORK_ERROR') {
        return 'Sin conexión a internet. Verifica tu conexión.';
    } else {
        return error.message || defaultMessage;
    }
};

/**
 * Utilidad para verificar si hay conexión
 * @returns {boolean}
 */
export const isOnline = () => {
    return navigator.onLine;
};

/**
 * Utilidad para reintentar petición
 * @param {Function} apiCall 
 * @param {number} maxRetries 
 * @param {number} delay 
 * @returns {Promise}
 */
export const retryRequest = async (apiCall, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error) {
            if (i === maxRetries || error.status !== 0) {
                throw error;
            }

            // Esperar antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
    }
};

/**
 * Cache simple para peticiones GET
 */
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const getCached = async (key, apiCall) => {
    const cached = cache.get(key);

    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log(`📦 Usando cache para: ${key}`);
        return cached.data;
    }

    const data = await apiCall();
    cache.set(key, {
        data,
        timestamp: Date.now()
    });

    return data;
};

/**
 * Limpiar cache
 */
export const clearCache = (key) => {
    if (key) {
        cache.delete(key);
    } else {
        cache.clear();
    }
};

export default apiClient;
