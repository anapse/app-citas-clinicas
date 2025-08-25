import { api, getCached } from './apiClient.js';

/**
 * Servicio para gestión de especialidades médicas
 * Maneja las especialidades con sus diferentes modos de reserva
 */

/**
 * Obtener lista de especialidades
 * @param {object} filters - Filtros opcionales
 * @param {string} filters.booking_mode - SLOT, REQUEST, WALKIN
 * @param {boolean} filters.active - Solo especialidades activas
 * @returns {Promise<array>}
 */
export const getSpecialties = async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.booking_mode) {
        params.append('booking_mode', filters.booking_mode);
    }

    if (filters.active !== undefined) {
        params.append('active', filters.active);
    }

    const cacheKey = `specialties_${params.toString()}`;

    return await getCached(cacheKey, () =>
        api.get(`/specialties?${params.toString()}`)
    );
};

/**
 * Obtener especialidad por ID
 * @param {number} id 
 * @returns {Promise<object>}
 */
export const getSpecialty = async (id) => {
    const cacheKey = `specialty_${id}`;

    return await getCached(cacheKey, () =>
        api.get(`/specialties/${id}`)
    );
};

/**
 * Crear nueva especialidad (solo admin)
 * @param {object} specialtyData
 * @param {string} specialtyData.name - Nombre de la especialidad
 * @param {string} specialtyData.description - Descripción
 * @param {string} specialtyData.booking_mode - SLOT, REQUEST, WALKIN
 * @param {number} specialtyData.slot_minutes - Minutos por slot (para SLOT)
 * @param {number} specialtyData.capacity - Capacidad por slot (para SLOT)
 * @returns {Promise<object>}
 */
export const createSpecialty = async (specialtyData) => {
    return await api.post('/specialties', specialtyData);
};

/**
 * Actualizar especialidad (solo admin)
 * @param {number} id 
 * @param {object} updateData 
 * @returns {Promise<object>}
 */
export const updateSpecialty = async (id, updateData) => {
    return await api.patch(`/specialties/${id}`, updateData);
};

/**
 * Eliminar especialidad (solo admin)
 * @param {number} id 
 * @returns {Promise<object>}
 */
export const deleteSpecialty = async (id) => {
    return await api.delete(`/specialties/${id}`);
};

/**
 * Obtener especialidades agrupadas por modo de reserva
 * @returns {Promise<object>}
 */
export const getSpecialtiesByMode = async () => {
    const specialties = await getSpecialties({ active: true });

    const grouped = {
        SLOT: [],
        REQUEST: [],
        WALKIN: []
    };

    specialties.forEach(specialty => {
        if (grouped[specialty.booking_mode]) {
            grouped[specialty.booking_mode].push(specialty);
        }
    });

    return grouped;
};

/**
 * Obtener especialidades con estadísticas
 * @returns {Promise<array>}
 */
export const getSpecialtiesWithStats = async () => {
    return await api.get('/specialties/stats');
};

/**
 * Obtener especialidades SLOT (con horarios)
 * @returns {Promise<array>}
 */
export const getSlotSpecialties = async () => {
    return await getSpecialties({
        booking_mode: 'SLOT',
        active: true
    });
};

/**
 * Obtener especialidades REQUEST (solicitud previa)
 * @returns {Promise<array>}
 */
export const getRequestSpecialties = async () => {
    return await getSpecialties({
        booking_mode: 'REQUEST',
        active: true
    });
};

/**
 * Obtener especialidades WALKIN (orden de llegada)
 * @returns {Promise<array>}
 */
export const getWalkinSpecialties = async () => {
    return await getSpecialties({
        booking_mode: 'WALKIN',
        active: true
    });
};

/**
 * Buscar especialidades por nombre
 * @param {string} query 
 * @returns {Promise<array>}
 */
export const searchSpecialties = async (query) => {
    const params = new URLSearchParams();
    params.append('search', query);
    params.append('active', 'true');

    return await api.get(`/specialties?${params.toString()}`);
};

/**
 * Obtener horarios generales de clínica para especialidades WALKIN
 * @returns {Promise<object>}
 */
export const getClinicHours = async () => {
    const cacheKey = 'clinic_hours';

    return await getCached(cacheKey, () =>
        api.get('/clinic-hours')
    );
};

/**
 * Utilidades para especialidades
 */
export const specialtyUtils = {
    /**
     * Verificar si una especialidad es de tipo SLOT
     * @param {object} specialty 
     * @returns {boolean}
     */
    isSlotBased: (specialty) => {
        return specialty.booking_mode === 'SLOT';
    },

    /**
     * Verificar si una especialidad es de tipo REQUEST
     * @param {object} specialty 
     * @returns {boolean}
     */
    isRequestBased: (specialty) => {
        return specialty.booking_mode === 'REQUEST';
    },

    /**
     * Verificar si una especialidad es de tipo WALKIN
     * @param {object} specialty 
     * @returns {boolean}
     */
    isWalkinBased: (specialty) => {
        return specialty.booking_mode === 'WALKIN';
    },

    /**
     * Obtener descripción del modo de reserva
     * @param {string} bookingMode 
     * @returns {string}
     */
    getBookingModeDescription: (bookingMode) => {
        const descriptions = {
            SLOT: 'Reserva por horarios específicos',
            REQUEST: 'Solicitud previa - Operador asigna horario',
            WALKIN: 'Atención por orden de llegada'
        };

        return descriptions[bookingMode] || 'Modo desconocido';
    },

    /**
     * Obtener icono del modo de reserva
     * @param {string} bookingMode 
     * @returns {string}
     */
    getBookingModeIcon: (bookingMode) => {
        const icons = {
            SLOT: '📅',
            REQUEST: '📝',
            WALKIN: '🚶'
        };

        return icons[bookingMode] || '❓';
    },

    /**
     * Formatear duración de slot
     * @param {number} minutes 
     * @returns {string}
     */
    formatSlotDuration: (minutes) => {
        if (!minutes) return '';

        if (minutes < 60) {
            return `${minutes} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;

            if (remainingMinutes === 0) {
                return `${hours}h`;
            } else {
                return `${hours}h ${remainingMinutes}min`;
            }
        }
    }
};

export default {
    getSpecialties,
    getSpecialty,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
    getSpecialtiesByMode,
    getSpecialtiesWithStats,
    getSlotSpecialties,
    getRequestSpecialties,
    getWalkinSpecialties,
    searchSpecialties,
    getClinicHours,
    specialtyUtils
};
