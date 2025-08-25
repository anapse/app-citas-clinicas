import { api } from './apiClient.js';

/**
 * Servicio para gestión de citas médicas
 * Maneja reservas, consultas, cancelaciones y gestión de citas
 */

/**
 * Crear cita pública (sin autenticación)
 * @param {object} appointmentData
 * @param {object} appointmentData.patient - Datos del paciente
 * @param {string} appointmentData.patient.firstName - Nombre
 * @param {string} appointmentData.patient.lastName - Apellido
 * @param {string} appointmentData.patient.identificacion - Identificación
 * @param {string} appointmentData.patient.email - Email
 * @param {string} appointmentData.patient.phone - Teléfono
 * @param {string} appointmentData.patient.birthDate - Fecha nacimiento (opcional)
 * @param {number} appointmentData.doctorId - ID del doctor
 * @param {number} appointmentData.especialidadId - ID de la especialidad
 * @param {string} appointmentData.fecha - Fecha de la cita
 * @param {string} appointmentData.hora - Hora de la cita
 * @param {string} appointmentData.motivo - Motivo de la consulta
 * @param {string} appointmentData.notas - Notas adicionales (opcional)
 * @returns {Promise<object>}
 */
export const createPublicAppointment = async (appointmentData) => {
    return await api.post('/appointments/public', appointmentData);
};

/**
 * Obtener horarios disponibles para un doctor en una fecha
 * @param {number} doctorId - ID del doctor
 * @param {string} date - Fecha (YYYY-MM-DD)
 * @returns {Promise<array>}
 */
export const getAvailableSlots = async (doctorId, date) => {
    const params = new URLSearchParams();
    params.append('doctorId', doctorId);
    params.append('date', date);

    return await api.get(`/availability/slots?${params.toString()}`);
};

/**
 * Buscar citas con filtros
 * @param {object} filters - Filtros de búsqueda
 * @param {string} filters.date - Fecha específica (YYYY-MM-DD)
 * @param {string} filters.startDate - Fecha de inicio del rango
 * @param {string} filters.endDate - Fecha de fin del rango
 * @param {number} filters.doctorId - ID del doctor
 * @param {number} filters.specialtyId - ID de la especialidad
 * @param {string} filters.dni - DNI del paciente
 * @param {string} filters.status - Estado: 'scheduled', 'completed', 'cancelled'
 * @param {number} filters.page - Página para paginación
 * @param {number} filters.limit - Elementos por página
 * @returns {Promise<object>} { data: array, pagination: object }
 */
export const searchAppointments = async (filters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            params.append(key, value);
        }
    });

    return await api.get(`/appointments?${params.toString()}`);
};

/**
 * Crear nueva cita (reserva SLOT)
 * @param {object} appointmentData
 * @param {number} appointmentData.specialty_id - ID de la especialidad
 * @param {number} appointmentData.doctor_id - ID del doctor
 * @param {object} appointmentData.patient - Datos del paciente
 * @param {string} appointmentData.patient.name - Nombre completo
 * @param {string} appointmentData.patient.dni - DNI (8 dígitos)
 * @param {string} appointmentData.patient.birthdate - Fecha nacimiento (YYYY-MM-DD)
 * @param {string} appointmentData.patient.phone - Teléfono
 * @param {string} appointmentData.start - Fecha/hora inicio (ISO string)
 * @param {string} appointmentData.end - Fecha/hora fin (ISO string)
 * @param {string} appointmentData.notes - Notas adicionales (opcional)
 * @returns {Promise<object>}
 */
export const createAppointment = async (appointmentData) => {
    return await api.post('/appointments', appointmentData);
};

/**
 * Obtener cita por ID
 * @param {number} id 
 * @returns {Promise<object>}
 */
export const getAppointment = async (id) => {
    return await api.get(`/appointments/${id}`);
};

/**
 * Actualizar cita (solo operador/admin)
 * @param {number} id 
 * @param {object} updateData 
 * @returns {Promise<object>}
 */
export const updateAppointment = async (id, updateData) => {
    return await api.patch(`/appointments/${id}`, updateData);
};

/**
 * Cancelar cita
 * @param {number} id 
 * @param {string} reason - Razón de cancelación (opcional)
 * @returns {Promise<object>}
 */
export const cancelAppointment = async (id, reason = null) => {
    const data = reason ? { reason } : {};
    return await api.delete(`/appointments/${id}`, { data });
};

/**
 * Obtener mis citas (usuario autenticado)
 * @param {object} filters
 * @param {string} filters.status - Estado de las citas
 * @param {string} filters.from - Fecha desde
 * @param {string} filters.to - Fecha hasta
 * @returns {Promise<array>}
 */
export const getMyAppointments = async (filters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            params.append(key, value);
        }
    });

    return await api.get(`/me/appointments?${params.toString()}`);
};

/**
 * Confirmar asistencia a cita (operador/doctor)
 * @param {number} id 
 * @returns {Promise<object>}
 */
export const confirmAttendance = async (id) => {
    return await api.patch(`/appointments/${id}/confirm`);
};

/**
 * Marcar cita como completada (doctor)
 * @param {number} id 
 * @param {object} completionData
 * @param {string} completionData.notes - Notas de la consulta
 * @param {string} completionData.diagnosis - Diagnóstico (opcional)
 * @param {string} completionData.treatment - Tratamiento (opcional)
 * @returns {Promise<object>}
 */
export const completeAppointment = async (id, completionData) => {
    return await api.patch(`/appointments/${id}/complete`, completionData);
};

/**
 * Reagendar cita (operador/admin)
 * @param {number} id 
 * @param {object} newSchedule
 * @param {number} newSchedule.doctor_id - Nuevo doctor (opcional)
 * @param {string} newSchedule.start - Nueva fecha/hora inicio
 * @param {string} newSchedule.end - Nueva fecha/hora fin
 * @param {string} newSchedule.reason - Razón del cambio
 * @returns {Promise<object>}
 */
export const rescheduleAppointment = async (id, newSchedule) => {
    return await api.patch(`/appointments/${id}/reschedule`, newSchedule);
};

/**
 * Obtener citas del día para un doctor
 * @param {number} doctorId 
 * @param {string} date - Fecha (YYYY-MM-DD), por defecto hoy
 * @returns {Promise<array>}
 */
export const getDoctorDayAppointments = async (doctorId, date = null) => {
    const params = new URLSearchParams();
    params.append('doctorId', doctorId);

    if (date) {
        params.append('date', date);
    }

    return await api.get(`/appointments/doctor/day?${params.toString()}`);
};

/**
 * Obtener citas de la semana para un doctor
 * @param {number} doctorId 
 * @param {string} startDate - Fecha de inicio de semana (opcional)
 * @returns {Promise<object>}
 */
export const getDoctorWeekAppointments = async (doctorId, startDate = null) => {
    const params = new URLSearchParams();
    params.append('doctorId', doctorId);

    if (startDate) {
        params.append('startDate', startDate);
    }

    return await api.get(`/appointments/doctor/week?${params.toString()}`);
};

/**
 * Obtener estadísticas de citas
 * @param {object} filters
 * @param {string} filters.period - 'day', 'week', 'month', 'year'
 * @param {number} filters.doctorId - ID del doctor (opcional)
 * @param {number} filters.specialtyId - ID de especialidad (opcional)
 * @returns {Promise<object>}
 */
export const getAppointmentStats = async (filters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            params.append(key, value);
        }
    });

    return await api.get(`/appointments/stats?${params.toString()}`);
};

/**
 * Utilidades para manejo de citas
 */
export const appointmentUtils = {
    /**
     * Verificar si una cita puede ser cancelada
     * @param {object} appointment 
     * @returns {boolean}
     */
    canBeCancelled: (appointment) => {
        if (appointment.status !== 'scheduled') return false;

        const appointmentTime = new Date(appointment.start);
        const now = new Date();
        const diffHours = (appointmentTime - now) / (1000 * 60 * 60);

        // Puede cancelarse si faltan más de 2 horas
        return diffHours > 2;
    },

    /**
     * Verificar si una cita puede ser reagendada
     * @param {object} appointment 
     * @returns {boolean}
     */
    canBeRescheduled: (appointment) => {
        return appointment.status === 'scheduled';
    },

    /**
     * Verificar si una cita está próxima (menos de 1 hora)
     * @param {object} appointment 
     * @returns {boolean}
     */
    isUpcoming: (appointment) => {
        const appointmentTime = new Date(appointment.start);
        const now = new Date();
        const diffMinutes = (appointmentTime - now) / (1000 * 60);

        return diffMinutes > 0 && diffMinutes <= 60;
    },

    /**
     * Verificar si una cita está atrasada
     * @param {object} appointment 
     * @returns {boolean}
     */
    isOverdue: (appointment) => {
        if (appointment.status !== 'scheduled') return false;

        const appointmentTime = new Date(appointment.start);
        const now = new Date();

        return now > appointmentTime;
    },

    /**
     * Obtener estado visual de la cita
     * @param {object} appointment 
     * @returns {string}
     */
    getStatusBadge: (appointment) => {
        switch (appointment.status) {
            case 'scheduled':
                if (appointmentUtils.isOverdue(appointment)) {
                    return 'overdue';
                } else if (appointmentUtils.isUpcoming(appointment)) {
                    return 'upcoming';
                } else {
                    return 'scheduled';
                }
            case 'completed':
                return 'completed';
            case 'cancelled':
                return 'cancelled';
            case 'no_show':
                return 'no-show';
            default:
                return 'unknown';
        }
    },

    /**
     * Formatear duración de la cita
     * @param {object} appointment 
     * @returns {string}
     */
    getDuration: (appointment) => {
        const start = new Date(appointment.start);
        const end = new Date(appointment.end);
        const diffMinutes = (end - start) / (1000 * 60);

        if (diffMinutes < 60) {
            return `${diffMinutes} min`;
        } else {
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
        }
    },

    /**
     * Obtener tiempo restante hasta la cita
     * @param {object} appointment 
     * @returns {string}
     */
    getTimeUntil: (appointment) => {
        const appointmentTime = new Date(appointment.start);
        const now = new Date();
        const diff = appointmentTime - now;

        if (diff <= 0) return 'Pasada';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            return `En ${days} día${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `En ${hours} hora${hours > 1 ? 's' : ''}`;
        } else {
            return `En ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        }
    },

    /**
     * Formatear información del paciente para mostrar
     * @param {object} appointment 
     * @returns {object}
     */
    formatPatientInfo: (appointment) => {
        const patient = appointment.patient_data;

        return {
            name: patient.name,
            dni: patient.dni,
            phone: patient.phone,
            age: patient.birthdate ? appointmentUtils.calculateAge(patient.birthdate) : null
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
    }
};

export default {
    searchAppointments,
    createAppointment,
    createPublicAppointment,
    getAvailableSlots,
    getAppointment,
    updateAppointment,
    cancelAppointment,
    getMyAppointments,
    confirmAttendance,
    completeAppointment,
    rescheduleAppointment,
    getDoctorDayAppointments,
    getDoctorWeekAppointments,
    getAppointmentStats,
    appointmentUtils
};
