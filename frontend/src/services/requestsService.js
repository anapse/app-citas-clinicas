import { api } from './apiClient.js';

/**
 * Servicio para gestión de solicitudes de citas médicas
 * Maneja especialidades de tipo REQUEST donde el operador asigna horarios
 */

/**
 * Crear nueva solicitud de cita
 * @param {object} requestData
 * @param {number} requestData.specialty_id - ID de la especialidad
 * @param {number} requestData.doctor_id - ID del doctor (opcional)
 * @param {object} requestData.patient - Datos del paciente
 * @param {string} requestData.patient.name - Nombre completo
 * @param {string} requestData.patient.dni - DNI (8 dígitos)
 * @param {string} requestData.patient.birthdate - Fecha nacimiento (YYYY-MM-DD)
 * @param {string} requestData.patient.phone - Teléfono
 * @param {string} requestData.note - Nota adicional (opcional)
 * @returns {Promise<object>}
 */
export const createRequest = async (requestData) => {
    return await api.post('/requests', requestData);
};

/**
 * Obtener lista de solicitudes con filtros
 * @param {object} filters - Filtros de búsqueda
 * @param {string} filters.status - Estado: 'pending', 'assigned', 'cancelled'
 * @param {number} filters.specialtyId - ID de la especialidad
 * @param {number} filters.doctorId - ID del doctor
 * @param {string} filters.dni - DNI del paciente
 * @param {string} filters.startDate - Fecha desde
 * @param {string} filters.endDate - Fecha hasta
 * @param {number} filters.page - Página
 * @param {number} filters.limit - Elementos por página
 * @returns {Promise<object>} { data: array, pagination: object }
 */
export const getRequests = async (filters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            params.append(key, value);
        }
    });

    return await api.get(`/requests?${params.toString()}`);
};

/**
 * Obtener solicitudes pendientes (para operador)
 * @param {object} filters
 * @param {number} filters.specialtyId - Filtrar por especialidad
 * @param {number} filters.limit - Límite de resultados
 * @returns {Promise<array>}
 */
export const getPendingRequests = async (filters = {}) => {
    const requestFilters = {
        ...filters,
        status: 'pending'
    };

    const response = await getRequests(requestFilters);
    return response.data || response;
};

/**
 * Obtener solicitud por ID
 * @param {number} id 
 * @returns {Promise<object>}
 */
export const getRequest = async (id) => {
    return await api.get(`/requests/${id}`);
};

/**
 * Asignar horario a una solicitud (convertir a cita)
 * @param {number} id 
 * @param {object} assignmentData
 * @param {number} assignmentData.doctor_id - ID del doctor
 * @param {string} assignmentData.start - Fecha/hora inicio (ISO string)
 * @param {string} assignmentData.end - Fecha/hora fin (ISO string)
 * @param {string} assignmentData.notes - Notas del operador (opcional)
 * @returns {Promise<object>}
 */
export const assignRequest = async (id, assignmentData) => {
    return await api.patch(`/requests/${id}/assign`, assignmentData);
};

/**
 * Cancelar solicitud
 * @param {number} id 
 * @param {string} reason - Razón de cancelación
 * @returns {Promise<object>}
 */
export const cancelRequest = async (id, reason) => {
    return await api.patch(`/requests/${id}/cancel`, { reason });
};

/**
 * Actualizar solicitud (solo antes de asignar)
 * @param {number} id 
 * @param {object} updateData 
 * @returns {Promise<object>}
 */
export const updateRequest = async (id, updateData) => {
    return await api.patch(`/requests/${id}`, updateData);
};

/**
 * Obtener mis solicitudes (usuario autenticado)
 * @param {object} filters
 * @param {string} filters.status - Estado de las solicitudes
 * @returns {Promise<array>}
 */
export const getMyRequests = async (filters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            params.append(key, value);
        }
    });

    return await api.get(`/me/requests?${params.toString()}`);
};

/**
 * Obtener estadísticas de solicitudes
 * @param {object} filters
 * @param {string} filters.period - 'day', 'week', 'month', 'year'
 * @param {number} filters.specialtyId - ID de especialidad (opcional)
 * @returns {Promise<object>}
 */
export const getRequestStats = async (filters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            params.append(key, value);
        }
    });

    return await api.get(`/requests/stats?${params.toString()}`);
};

/**
 * Buscar solicitudes por DNI del paciente
 * @param {string} dni 
 * @returns {Promise<array>}
 */
export const searchRequestsByDni = async (dni) => {
    return await getRequests({ dni });
};

/**
 * Obtener solicitudes recientes (últimas 24 horas)
 * @param {number} limit 
 * @returns {Promise<array>}
 */
export const getRecentRequests = async (limit = 10) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const filters = {
        startDate: yesterday.toISOString().split('T')[0],
        limit,
        status: 'pending'
    };

    const response = await getRequests(filters);
    return response.data || response;
};

/**
 * Marcar solicitud como urgente (operador)
 * @param {number} id 
 * @param {boolean} urgent 
 * @returns {Promise<object>}
 */
export const markRequestUrgent = async (id, urgent = true) => {
    return await api.patch(`/requests/${id}/urgent`, { urgent });
};

/**
 * Agregar nota a solicitud (operador)
 * @param {number} id 
 * @param {string} note 
 * @returns {Promise<object>}
 */
export const addRequestNote = async (id, note) => {
    return await api.post(`/requests/${id}/notes`, { note });
};

/**
 * Utilidades para manejo de solicitudes
 */
export const requestUtils = {
    /**
     * Verificar si una solicitud puede ser asignada
     * @param {object} request 
     * @returns {boolean}
     */
    canBeAssigned: (request) => {
        return request.status === 'pending';
    },

    /**
     * Verificar si una solicitud puede ser cancelada
     * @param {object} request 
     * @returns {boolean}
     */
    canBeCancelled: (request) => {
        return request.status === 'pending';
    },

    /**
     * Verificar si una solicitud puede ser editada
     * @param {object} request 
     * @returns {boolean}
     */
    canBeEdited: (request) => {
        return request.status === 'pending';
    },

    /**
     * Obtener tiempo transcurrido desde la solicitud
     * @param {object} request 
     * @returns {string}
     */
    getTimeElapsed: (request) => {
        const requestTime = new Date(request.created_at);
        const now = new Date();
        const diff = now - requestTime;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            return `Hace ${days} día${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        } else {
            return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        }
    },

    /**
     * Verificar si una solicitud es urgente
     * @param {object} request 
     * @returns {boolean}
     */
    isUrgent: (request) => {
        return request.urgent === true;
    },

    /**
     * Verificar si una solicitud está atrasada (más de 24 horas sin asignar)
     * @param {object} request 
     * @returns {boolean}
     */
    isOverdue: (request) => {
        if (request.status !== 'pending') return false;

        const requestTime = new Date(request.created_at);
        const now = new Date();
        const diffHours = (now - requestTime) / (1000 * 60 * 60);

        return diffHours > 24;
    },

    /**
     * Obtener prioridad de la solicitud
     * @param {object} request 
     * @returns {string}
     */
    getPriority: (request) => {
        if (requestUtils.isUrgent(request)) {
            return 'urgent';
        } else if (requestUtils.isOverdue(request)) {
            return 'overdue';
        } else {
            return 'normal';
        }
    },

    /**
     * Obtener color de badge según el estado
     * @param {object} request 
     * @returns {string}
     */
    getStatusBadge: (request) => {
        switch (request.status) {
            case 'pending':
                return requestUtils.isOverdue(request) ? 'danger' : 'warning';
            case 'assigned':
                return 'success';
            case 'cancelled':
                return 'secondary';
            default:
                return 'secondary';
        }
    },

    /**
     * Formatear información del paciente
     * @param {object} request 
     * @returns {object}
     */
    formatPatientInfo: (request) => {
        const patient = request.patient_data;

        return {
            name: patient.name,
            dni: patient.dni,
            phone: patient.phone,
            age: patient.birthdate ? requestUtils.calculateAge(patient.birthdate) : null
        };
    },

    /**
     * Calcular edad desde fecha de nacimiento
     * @param {string} birthdate - Formato YYYY-MM-DD
     * @returns {number}
     */
    calculateAge: (birthdate) => {
        const birth = new Date(birthdate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    },

    /**
     * Obtener texto descriptivo del estado
     * @param {string} status 
     * @returns {string}
     */
    getStatusText: (status) => {
        const statusTexts = {
            pending: 'Pendiente de asignación',
            assigned: 'Cita asignada',
            cancelled: 'Cancelada'
        };

        return statusTexts[status] || 'Estado desconocido';
    }
};

export default {
    createRequest,
    getRequests,
    getPendingRequests,
    getRequest,
    assignRequest,
    cancelRequest,
    updateRequest,
    getMyRequests,
    getRequestStats,
    searchRequestsByDni,
    getRecentRequests,
    markRequestUrgent,
    addRequestNote,
    requestUtils
};
