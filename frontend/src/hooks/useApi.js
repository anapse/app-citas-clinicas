import React, { useState, useCallback } from 'react';
import { handleApiError } from '../services/apiClient.js';

/**
 * Hook personalizado para manejar llamadas a la API
 * Proporciona estados de loading, error y utilidades comunes
 */
export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Ejecutar llamada a la API con manejo de estados
     * @param {Function} apiCall - Función que hace la llamada a la API
     * @param {object} options - Opciones adicionales
     * @param {boolean} options.showLoading - Mostrar estado de loading
     * @param {string} options.errorMessage - Mensaje de error personalizado
     * @returns {Promise}
     */
    const execute = useCallback(async (apiCall, options = {}) => {
        const { showLoading = true, errorMessage = null } = options;

        try {
            if (showLoading) {
                setLoading(true);
            }
            setError(null);

            const result = await apiCall();
            return result;
        } catch (error) {
            const errorMsg = errorMessage || handleApiError(error);
            setError(errorMsg);
            throw error;
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, []);

    /**
     * Limpiar error
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /**
     * Resetear estado
     */
    const reset = useCallback(() => {
        setLoading(false);
        setError(null);
    }, []);

    return {
        loading,
        error,
        execute,
        clearError,
        reset
    };
};

/**
 * Hook para manejar formularios con API
 * @param {Function} submitFn - Función de submit que llama a la API
 * @param {object} options - Opciones del formulario
 * @returns {object}
 */
export const useApiForm = (submitFn, options = {}) => {
    const { onSuccess, onError, resetOnSuccess = false } = options;
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = useCallback(async (data) => {
        try {
            setSubmitting(true);
            setError(null);
            setSuccess(false);

            const result = await submitFn(data);

            setSuccess(true);

            if (onSuccess) {
                onSuccess(result);
            }

            if (resetOnSuccess) {
                setTimeout(() => setSuccess(false), 3000);
            }

            return result;
        } catch (error) {
            const errorMsg = handleApiError(error);
            setError(errorMsg);

            if (onError) {
                onError(error);
            }

            throw error;
        } finally {
            setSubmitting(false);
        }
    }, [submitFn, onSuccess, onError, resetOnSuccess]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const clearSuccess = useCallback(() => {
        setSuccess(false);
    }, []);

    const reset = useCallback(() => {
        setSubmitting(false);
        setError(null);
        setSuccess(false);
    }, []);

    return {
        submitting,
        error,
        success,
        handleSubmit,
        clearError,
        clearSuccess,
        reset
    };
};

/**
 * Hook para datos que se cargan automáticamente
 * @param {Function} fetchFn - Función que obtiene los datos
 * @param {array} dependencies - Dependencias que triggerean la recarga
 * @param {object} options - Opciones adicionales
 * @returns {object}
 */
export const useApiData = (fetchFn, dependencies = [], options = {}) => {
    const { immediate = true, defaultValue = null } = options;
    const [data, setData] = useState(defaultValue);
    const [loading, setLoading] = useState(immediate);
    const [error, setError] = useState(null);

    const { execute } = useApi();

    const fetchData = useCallback(async () => {
        try {
            const result = await execute(fetchFn, { showLoading: false });
            setData(result);
            return result;
        } catch (error) {
            setError(handleApiError(error));
            throw error;
        } finally {
            setLoading(false);
        }
    }, [execute, fetchFn]);

    // Cargar datos automáticamente
    React.useEffect(() => {
        if (immediate) {
            fetchData();
        }
    }, dependencies);

    const refetch = useCallback(() => {
        setLoading(true);
        setError(null);
        return fetchData();
    }, [fetchData]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        data,
        loading,
        error,
        refetch,
        clearError
    };
};

/**
 * Hook para manejar paginación con API
 * @param {Function} fetchFn - Función que obtiene datos paginados
 * @param {object} initialFilters - Filtros iniciales
 * @param {number} pageSize - Tamaño de página
 * @returns {object}
 */
export const useApiPagination = (fetchFn, initialFilters = {}, pageSize = 10) => {
    const [data, setData] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: pageSize,
        total: 0,
        totalPages: 0
    });
    const [filters, setFilters] = useState(initialFilters);
    const { loading, error, execute } = useApi();

    const fetchData = useCallback(async (newFilters = {}, newPage = 1) => {
        const params = {
            ...filters,
            ...newFilters,
            page: newPage,
            limit: pageSize
        };

        const result = await execute(() => fetchFn(params));

        setData(result.data || result);
        setPagination(result.pagination || {
            page: newPage,
            limit: pageSize,
            total: result.data?.length || result.length || 0,
            totalPages: Math.ceil((result.data?.length || result.length || 0) / pageSize)
        });

        return result;
    }, [execute, fetchFn, filters, pageSize]);

    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        fetchData(newFilters, 1);
    }, [fetchData]);

    const goToPage = useCallback((page) => {
        fetchData({}, page);
    }, [fetchData]);

    const nextPage = useCallback(() => {
        if (pagination.page < pagination.totalPages) {
            goToPage(pagination.page + 1);
        }
    }, [pagination.page, pagination.totalPages, goToPage]);

    const prevPage = useCallback(() => {
        if (pagination.page > 1) {
            goToPage(pagination.page - 1);
        }
    }, [pagination.page, goToPage]);

    const refresh = useCallback(() => {
        fetchData({}, pagination.page);
    }, [fetchData, pagination.page]);

    // Cargar datos iniciales
    React.useEffect(() => {
        fetchData();
    }, []);

    return {
        data,
        pagination,
        filters,
        loading,
        error,
        updateFilters,
        goToPage,
        nextPage,
        prevPage,
        refresh
    };
};

export default useApi;
