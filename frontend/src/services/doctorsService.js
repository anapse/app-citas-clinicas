import { api, getCached } from './apiClient.js';

/**
 * Servicio para gestión de doctores
 * Maneja perfiles, especialidades y horarios de doctores
 */

/**
 * Obtener lista de doctores
 * @param {object} filters - Filtros opcionales
 * @param {number} filters.specialtyId - Filtrar por especialidad
 * @param {boolean} filters.visible - Solo doctores visibles públicamente
 * @param {boolean} filters.active - Solo doctores activos
 * @returns {Promise<array>}
 */
export const getDoctors = async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.specialtyId) {
        params.append('specialtyId', filters.specialtyId);
    }

    if (filters.visible !== undefined) {
        params.append('visible', filters.visible);
    }

    if (filters.active !== undefined) {
        params.append('active', filters.active);
    }

    const cacheKey = `doctors_${params.toString()}`;

    return await getCached(cacheKey, () =>
        api.get(`/doctors?${params.toString()}`)
    );
};

/**
 * Obtener doctor por ID con perfil completo
 * @param {number} id 
 * @returns {Promise<object>}
 */
export const getDoctor = async (id) => {
    const cacheKey = `doctor_${id}`;

    return await getCached(cacheKey, () =>
        api.get(`/doctors/${id}`)
    );
};

/**
 * Obtener perfil del doctor actual (solo para doctores autenticados)
 * @returns {Promise<object>}
 */
export const getMyProfile = async () => {
    return await api.get('/doctors/me');
};

/**
 * Actualizar perfil del doctor
 * @param {number} id 
 * @param {object} profileData
 * @param {string} profileData.bio - Biografía
 * @param {string} profileData.education - Educación
 * @param {string} profileData.experience - Experiencia
 * @param {string} profileData.phone - Teléfono
 * @returns {Promise<object>}
 */
export const updateDoctorProfile = async (id, profileData) => {
    return await api.patch(`/doctors/${id}/profile`, profileData);
};

/**
 * Actualizar mi perfil (doctor autenticado)
 * @param {object} profileData 
 * @returns {Promise<object>}
 */
export const updateMyProfile = async (profileData) => {
    return await api.patch('/doctors/me/profile', profileData);
};

/**
 * Subir foto de perfil del doctor
 * @param {number} id 
 * @param {File} photoFile 
 * @returns {Promise<object>}
 */
export const uploadDoctorPhoto = async (id, photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);

    return await api.upload(`/doctors/${id}/photo`, formData);
};

/**
 * Subir mi foto de perfil (doctor autenticado)
 * @param {File} photoFile 
 * @returns {Promise<object>}
 */
export const uploadMyPhoto = async (photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);

    return await api.upload('/doctors/me/photo', formData);
};

/**
 * Crear nuevo doctor (solo admin/operador)
 * @param {object} doctorData
 * @param {string} doctorData.name - Nombre completo
 * @param {string} doctorData.email - Email
 * @param {string} doctorData.phone - Teléfono
 * @param {array} doctorData.specialtyIds - IDs de especialidades
 * @returns {Promise<object>}
 */
export const createDoctor = async (doctorData) => {
    return await api.post('/doctors', doctorData);
};

/**
 * Actualizar datos básicos del doctor (solo admin/operador)
 * @param {number} id 
 * @param {object} updateData 
 * @returns {Promise<object>}
 */
export const updateDoctor = async (id, updateData) => {
    return await api.patch(`/doctors/${id}`, updateData);
};

/**
 * Activar/Desactivar doctor (solo admin/operador)
 * @param {number} id 
 * @param {boolean} active 
 * @returns {Promise<object>}
 */
export const toggleDoctorStatus = async (id, active) => {
    return await api.patch(`/doctors/${id}/status`, { active });
};

/**
 * Hacer visible/invisible doctor públicamente (solo admin/operador)
 * @param {number} id 
 * @param {boolean} visible 
 * @returns {Promise<object>}
 */
export const toggleDoctorVisibility = async (id, visible) => {
    return await api.patch(`/doctors/${id}/visibility`, { visible });
};

/**
 * Obtener especialidades del doctor
 * @param {number} id 
 * @returns {Promise<array>}
 */
export const getDoctorSpecialties = async (id) => {
    return await api.get(`/doctors/${id}/specialties`);
};

/**
 * Asignar especialidades al doctor (solo admin/operador)
 * @param {number} id 
 * @param {array} specialtyIds 
 * @returns {Promise<object>}
 */
export const assignDoctorSpecialties = async (id, specialtyIds) => {
    return await api.post(`/doctors/${id}/specialties`, { specialtyIds });
};

/**
 * Obtener próximos horarios del doctor
 * @param {number} id 
 * @param {number} days - Número de días a obtener
 * @returns {Promise<array>}
 */
export const getDoctorUpcomingSchedules = async (id, days = 7) => {
    const params = new URLSearchParams();
    params.append('days', days);

    return await api.get(`/doctors/${id}/schedules/upcoming?${params.toString()}`);
};

/**
 * Obtener doctores visibles públicamente
 * @param {number} specialtyId - Opcional, filtrar por especialidad
 * @returns {Promise<array>}
 */
export const getPublicDoctors = async (specialtyId = null) => {
    const filters = { visible: true, active: true };

    if (specialtyId) {
        filters.specialtyId = specialtyId;
    }

    return await getDoctors(filters);
};

/**
 * Buscar doctores por nombre
 * @param {string} query 
 * @param {number} specialtyId - Opcional
 * @returns {Promise<array>}
 */
export const searchDoctors = async (query, specialtyId = null) => {
    const params = new URLSearchParams();
    params.append('search', query);
    params.append('visible', 'true');
    params.append('active', 'true');

    if (specialtyId) {
        params.append('specialtyId', specialtyId);
    }

    return await api.get(`/doctors?${params.toString()}`);
};

/**
 * Obtener estadísticas del doctor (solo admin/operador/el mismo doctor)
 * @param {number} id 
 * @param {string} period - 'week', 'month', 'year'
 * @returns {Promise<object>}
 */
export const getDoctorStats = async (id, period = 'month') => {
    const params = new URLSearchParams();
    params.append('period', period);

    return await api.get(`/doctors/${id}/stats?${params.toString()}`);
};

/**
 * Obtener mis estadísticas (doctor autenticado)
 * @param {string} period 
 * @returns {Promise<object>}
 */
export const getMyStats = async (period = 'month') => {
    const params = new URLSearchParams();
    params.append('period', period);

    return await api.get(`/doctors/me/stats?${params.toString()}`);
};

/**
 * Utilidades para doctores
 */
export const doctorUtils = {
    /**
     * Obtener iniciales del nombre del doctor
     * @param {string} name 
     * @returns {string}
     */
    getInitials: (name) => {
        if (!name) return '';

        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    },

    /**
     * Formatear nombre del doctor con título
     * @param {string} name 
     * @param {string} gender - 'M' o 'F'
     * @returns {string}
     */
    formatDoctorName: (name, gender = 'M') => {
        if (!name) return '';

        const title = gender === 'F' ? 'Dra.' : 'Dr.';
        return `${title} ${name}`;
    },

    /**
     * Verificar si el doctor tiene foto
     * @param {object} doctor 
     * @returns {boolean}
     */
    hasPhoto: (doctor) => {
        return !!(doctor?.profile?.photo_url || doctor?.profile?.photo_svg);
    },

    /**
     * Obtener URL de la foto del doctor
     * @param {object} doctor 
     * @returns {string|null}
     */
    getPhotoUrl: (doctor) => {
        return doctor?.profile?.photo_url || null;
    },

    /**
     * Obtener SVG de la foto del doctor
     * @param {object} doctor 
     * @returns {string|null}
     */
    getPhotoSvg: (doctor) => {
        return doctor?.profile?.photo_svg || null;
    },

    /**
     * Verificar si el doctor está disponible para citas online
     * @param {object} doctor 
     * @returns {boolean}
     */
    isAvailableOnline: (doctor) => {
        return doctor?.active && doctor?.visible;
    },

    /**
     * Obtener especialidad principal del doctor
     * @param {object} doctor 
     * @returns {object|null}
     */
    getPrimarySpecialty: (doctor) => {
        if (!doctor?.specialties?.length) return null;

        // La primera especialidad se considera principal
        return doctor.specialties[0];
    },

    /**
     * Verificar si el doctor tiene una especialidad específica
     * @param {object} doctor 
     * @param {number} specialtyId 
     * @returns {boolean}
     */
    hasSpecialty: (doctor, specialtyId) => {
        if (!doctor?.specialties?.length) return false;

        return doctor.specialties.some(specialty => specialty.id === specialtyId);
    }
};

export default {
    getDoctors,
    getDoctor,
    getMyProfile,
    updateDoctorProfile,
    updateMyProfile,
    uploadDoctorPhoto,
    uploadMyPhoto,
    createDoctor,
    updateDoctor,
    toggleDoctorStatus,
    toggleDoctorVisibility,
    getDoctorSpecialties,
    assignDoctorSpecialties,
    getDoctorUpcomingSchedules,
    getPublicDoctors,
    searchDoctors,
    getDoctorStats,
    getMyStats,
    doctorUtils
};
