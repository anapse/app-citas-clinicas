import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import 'dayjs/locale/es.js';

// Configurar dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.locale('es');

const TIMEZONE = 'America/Lima';

/**
 * Formatear fecha para mostrar al usuario
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
    if (!date) return '';
    return dayjs(date).tz(TIMEZONE).format(format);
};

/**
 * Formatear hora para mostrar al usuario
 */
export const formatTime = (date, format = 'HH:mm') => {
    if (!date) return '';
    return dayjs(date).tz(TIMEZONE).format(format);
};

/**
 * Formatear fecha y hora completa
 */
export const formatDateTime = (date, format = 'DD/MM/YYYY HH:mm') => {
    if (!date) return '';
    return dayjs(date).tz(TIMEZONE).format(format);
};

/**
 * Parsear slot start/end a formato HH:mm
 */
export const parseSlotTime = (isoString) => {
    if (!isoString) return '';
    return dayjs(isoString).tz(TIMEZONE).format('HH:mm');
};

/**
 * Obtener fecha actual en timezone Lima
 */
export const now = () => {
    return dayjs().tz(TIMEZONE);
};

/**
 * Obtener fecha de hoy en formato YYYY-MM-DD
 */
export const today = () => {
    return dayjs().tz(TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Verificar si una fecha es hoy
 */
export const isToday = (date) => {
    if (!date) return false;
    return dayjs(date).tz(TIMEZONE).isSame(dayjs().tz(TIMEZONE), 'day');
};

/**
 * Verificar si una fecha es en el pasado
 */
export const isPast = (date) => {
    if (!date) return false;
    return dayjs(date).tz(TIMEZONE).isBefore(dayjs().tz(TIMEZONE));
};

/**
 * Verificar si una fecha es en el futuro
 */
export const isFuture = (date) => {
    if (!date) return false;
    return dayjs(date).tz(TIMEZONE).isAfter(dayjs().tz(TIMEZONE));
};

/**
 * Agregar días a una fecha
 */
export const addDays = (date, days) => {
    return dayjs(date).tz(TIMEZONE).add(days, 'day');
};

/**
 * Restar días a una fecha
 */
export const subtractDays = (date, days) => {
    return dayjs(date).tz(TIMEZONE).subtract(days, 'day');
};

/**
 * Obtener el inicio del día
 */
export const startOfDay = (date) => {
    return dayjs(date).tz(TIMEZONE).startOf('day');
};

/**
 * Obtener el fin del día
 */
export const endOfDay = (date) => {
    return dayjs(date).tz(TIMEZONE).endOf('day');
};

/**
 * Convertir fecha local a UTC para enviar al backend
 */
export const toUTC = (date) => {
    return dayjs.tz(date, TIMEZONE).utc().toISOString();
};

/**
 * Convertir fecha UTC del backend a local
 */
export const fromUTC = (utcString) => {
    return dayjs.utc(utcString).tz(TIMEZONE);
};

/**
 * Formatear duración en minutos a texto legible
 */
export const formatDuration = (minutes) => {
    if (!minutes) return '';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
        return `${mins} min`;
    } else if (mins === 0) {
        return `${hours}h`;
    } else {
        return `${hours}h ${mins}min`;
    }
};

/**
 * Obtener nombre del día de la semana
 */
export const getDayName = (date) => {
    return dayjs(date).tz(TIMEZONE).format('dddd');
};

/**
 * Obtener nombre del mes
 */
export const getMonthName = (date) => {
    return dayjs(date).tz(TIMEZONE).format('MMMM');
};

/**
 * Generar array de fechas para un rango
 */
export const generateDateRange = (startDate, endDate) => {
    const dates = [];
    let current = dayjs(startDate).tz(TIMEZONE);
    const end = dayjs(endDate).tz(TIMEZONE);

    while (current.isSameOrBefore(end, 'day')) {
        dates.push(current.format('YYYY-MM-DD'));
        current = current.add(1, 'day');
    }

    return dates;
};

/**
 * Verificar si una fecha está en un rango
 */
export const isInRange = (date, startDate, endDate) => {
    const target = dayjs(date).tz(TIMEZONE);
    const start = dayjs(startDate).tz(TIMEZONE);
    const end = dayjs(endDate).tz(TIMEZONE);

    return target.isSameOrAfter(start, 'day') && target.isSameOrBefore(end, 'day');
};

/**
 * Obtener fecha mínima para reservas (hoy)
 */
export const getMinBookingDate = () => {
    return today();
};

/**
 * Obtener fecha máxima para reservas (30 días)
 */
export const getMaxBookingDate = () => {
    return dayjs().tz(TIMEZONE).add(30, 'day').format('YYYY-MM-DD');
};
