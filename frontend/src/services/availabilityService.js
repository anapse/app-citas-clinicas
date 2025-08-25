import { api } from './apiClient.js';
import { formatInputDate } from '../utils/date.js';

/**
 * Servicio para consultar disponibilidad de citas médicas
 * Maneja slots de tiempo disponibles según especialidad y doctor
 */

/**
 * Obtener disponibilidad para una fecha específica
 * @param {object} params
 * @param {number} params.specialtyId - ID de la especialidad (requerido)
 * @param {string} params.date - Fecha en formato YYYY-MM-DD (requerido)
 * @param {number} params.doctorId - ID del doctor (opcional)
 * @returns {Promise<array>} Array de slots disponibles
 */
export const getAvailability = async ({ specialtyId, date, doctorId = null }) => {
    const params = new URLSearchParams();
    params.append('specialtyId', specialtyId);
    params.append('date', date);

    if (doctorId) {
        params.append('doctorId', doctorId);
    }

    return await api.get(`/availability?${params.toString()}`);
};

/**
 * Obtener disponibilidad semanal
 * @param {object} params
 * @param {number} params.specialtyId - ID de la especialidad
 * @param {string} params.startDate - Fecha de inicio (opcional, por defecto hoy)
 * @param {number} params.doctorId - ID del doctor (opcional)
 * @returns {Promise<object>} Disponibilidad por día de la semana
 */
export const getWeeklyAvailability = async ({ specialtyId, startDate = null, doctorId = null }) => {
    const params = new URLSearchParams();
    params.append('specialtyId', specialtyId);

    if (startDate) {
        params.append('startDate', startDate);
    }

    if (doctorId) {
        params.append('doctorId', doctorId);
    }

    return await api.get(`/availability/weekly?${params.toString()}`);
};

/**
 * Obtener próximas fechas disponibles
 * @param {object} params
 * @param {number} params.specialtyId 
 * @param {number} params.doctorId 
 * @param {number} params.days - Número de días a revisar (por defecto 30)
 * @returns {Promise<array>} Array de fechas con disponibilidad
 */
export const getUpcomingAvailability = async ({ specialtyId, doctorId = null, days = 30 }) => {
    const params = new URLSearchParams();
    params.append('specialtyId', specialtyId);
    params.append('days', days);

    if (doctorId) {
        params.append('doctorId', doctorId);
    }

    return await api.get(`/availability/upcoming?${params.toString()}`);
};

/**
 * Verificar disponibilidad de un slot específico
 * @param {object} params
 * @param {number} params.specialtyId 
 * @param {number} params.doctorId 
 * @param {string} params.start - ISO string de fecha/hora de inicio
 * @param {string} params.end - ISO string de fecha/hora de fin
 * @returns {Promise<object>} { available: boolean, reason?: string }
 */
export const checkSlotAvailability = async ({ specialtyId, doctorId, start, end }) => {
    const params = {
        specialtyId,
        doctorId,
        start,
        end
    };

    return await api.post('/availability/check', params);
};

/**
 * Obtener horarios generales de clínica (para especialidades WALKIN)
 * @returns {Promise<object>}
 */
export const getClinicHours = async () => {
    return await api.get('/availability/clinic-hours');
};

/**
 * Obtener siguiente slot disponible
 * @param {object} params
 * @param {number} params.specialtyId 
 * @param {number} params.doctorId 
 * @param {string} params.fromDate - Buscar desde esta fecha (opcional)
 * @returns {Promise<object|null>} Primer slot disponible o null
 */
export const getNextAvailableSlot = async ({ specialtyId, doctorId = null, fromDate = null }) => {
    const params = new URLSearchParams();
    params.append('specialtyId', specialtyId);

    if (doctorId) {
        params.append('doctorId', doctorId);
    }

    if (fromDate) {
        params.append('fromDate', fromDate);
    }

    return await api.get(`/availability/next?${params.toString()}`);
};

/**
 * Utilidades para manejo de disponibilidad
 */
export const availabilityUtils = {
    /**
     * Filtrar slots disponibles
     * @param {array} slots 
     * @returns {array}
     */
    getAvailableSlots: (slots) => {
        return slots.filter(slot => slot.available);
    },

    /**
     * Filtrar slots ocupados
     * @param {array} slots 
     * @returns {array}
     */
    getTakenSlots: (slots) => {
        return slots.filter(slot => !slot.available);
    },

    /**
     * Contar slots disponibles
     * @param {array} slots 
     * @returns {number}
     */
    countAvailableSlots: (slots) => {
        return slots.filter(slot => slot.available).length;
    },

    /**
     * Verificar si hay disponibilidad en una fecha
     * @param {array} slots 
     * @returns {boolean}
     */
    hasAvailability: (slots) => {
        return slots.some(slot => slot.available);
    },

    /**
     * Agrupar slots por hora
     * @param {array} slots 
     * @returns {object}
     */
    groupSlotsByHour: (slots) => {
        const grouped = {};

        slots.forEach(slot => {
            const hour = new Date(slot.start).getHours();
            const hourKey = `${hour.toString().padStart(2, '0')}:00`;

            if (!grouped[hourKey]) {
                grouped[hourKey] = [];
            }

            grouped[hourKey].push(slot);
        });

        return grouped;
    },

    /**
     * Obtener horarios disponibles como array de strings
     * @param {array} slots 
     * @returns {array}
     */
    getAvailableTimes: (slots) => {
        return slots
            .filter(slot => slot.available)
            .map(slot => {
                const start = new Date(slot.start);
                return start.toLocaleTimeString('es-PE', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            });
    },

    /**
     * Encontrar el mejor slot disponible (más temprano)
     * @param {array} slots 
     * @returns {object|null}
     */
    getBestAvailableSlot: (slots) => {
        const availableSlots = slots.filter(slot => slot.available);

        if (availableSlots.length === 0) return null;

        return availableSlots.reduce((best, current) => {
            return new Date(current.start) < new Date(best.start) ? current : best;
        });
    },

    /**
     * Verificar si un slot está en el pasado
     * @param {object} slot 
     * @returns {boolean}
     */
    isSlotInPast: (slot) => {
        return new Date(slot.start) < new Date();
    },

    /**
     * Verificar si un slot está muy próximo (menos de 2 horas)
     * @param {object} slot 
     * @returns {boolean}
     */
    isSlotTooSoon: (slot) => {
        const now = new Date();
        const slotTime = new Date(slot.start);
        const diffHours = (slotTime - now) / (1000 * 60 * 60);

        return diffHours < 2;
    },

    /**
     * Formatear slot para mostrar en UI
     * @param {object} slot 
     * @returns {object}
     */
    formatSlotForUI: (slot) => {
        const start = new Date(slot.start);
        const end = new Date(slot.end);

        return {
            ...slot,
            timeRange: `${start.toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })} - ${end.toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })}`,
            dayName: start.toLocaleDateString('es-PE', { weekday: 'long' }),
            date: start.toLocaleDateString('es-PE'),
            isToday: start.toDateString() === new Date().toDateString(),
            isPast: start < new Date(),
            isTooSoon: (start - new Date()) / (1000 * 60 * 60) < 2
        };
    }
};

/**
 * Generador de rangos de fechas para búsqueda de disponibilidad
 */
export const dateRangeGenerator = {
    /**
     * Obtener próximos N días laborables
     * @param {number} count 
     * @returns {array}
     */
    getNextWorkingDays: (count = 30) => {
        const dates = [];
        const current = new Date();

        while (dates.length < count) {
            // Verificar que no sea domingo (día 0)
            if (current.getDay() !== 0) {
                dates.push(formatInputDate(current));
            }
            current.setDate(current.getDate() + 1);
        }

        return dates;
    },

    /**
     * Obtener fechas de la próxima semana
     * @param {Date} startDate 
     * @returns {array}
     */
    getWeekDates: (startDate = new Date()) => {
        const dates = [];
        const current = new Date(startDate);

        // Ir al lunes de la semana
        const dayOfWeek = current.getDay();
        const daysToMonday = dayOfWeek === 0 ? 1 : 1 - dayOfWeek;
        current.setDate(current.getDate() + daysToMonday);

        // Agregar 6 días (lunes a sábado)
        for (let i = 0; i < 6; i++) {
            dates.push(formatInputDate(current));
            current.setDate(current.getDate() + 1);
        }

        return dates;
    },

    /**
     * Obtener fechas del próximo mes
     * @param {Date} startDate 
     * @returns {array}
     */
    getMonthDates: (startDate = new Date()) => {
        const dates = [];
        const current = new Date(startDate);
        const month = current.getMonth();

        while (current.getMonth() === month) {
            // Solo días laborables (no domingo)
            if (current.getDay() !== 0) {
                dates.push(formatInputDate(current));
            }
            current.setDate(current.getDate() + 1);
        }

        return dates;
    }
};

export default {
    getAvailability,
    getWeeklyAvailability,
    getUpcomingAvailability,
    checkSlotAvailability,
    getClinicHours,
    getNextAvailableSlot,
    availabilityUtils,
    dateRangeGenerator
};
