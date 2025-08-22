const xss = require('xss');

class SecurityService {

    /**
     * Sanitiza contenido SVG removiendo elementos peligrosos
     * @param {string} svgContent - Contenido SVG a sanitizar
     * @returns {string} SVG sanitizado
     */
    sanitizeSvg(svgContent) {
        if (!svgContent) return null;

        // Configuración de XSS para SVG
        const svgOptions = {
            whiteList: {
                svg: ['xmlns', 'viewBox', 'width', 'height', 'style', 'class', 'id'],
                g: ['id', 'class', 'transform', 'style'],
                path: ['d', 'fill', 'stroke', 'stroke-width', 'class', 'id', 'style'],
                rect: ['x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'class', 'id', 'style'],
                circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width', 'class', 'id', 'style'],
                ellipse: ['cx', 'cy', 'rx', 'ry', 'fill', 'stroke', 'stroke-width', 'class', 'id', 'style'],
                line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width', 'class', 'id', 'style'],
                polyline: ['points', 'fill', 'stroke', 'stroke-width', 'class', 'id', 'style'],
                polygon: ['points', 'fill', 'stroke', 'stroke-width', 'class', 'id', 'style'],
                text: ['x', 'y', 'font-family', 'font-size', 'fill', 'class', 'id', 'style'],
                tspan: ['x', 'y', 'font-family', 'font-size', 'fill', 'class', 'id', 'style'],
                defs: [],
                linearGradient: ['id', 'x1', 'y1', 'x2', 'y2'],
                radialGradient: ['id', 'cx', 'cy', 'r'],
                stop: ['offset', 'stop-color', 'stop-opacity'],
                clipPath: ['id'],
                mask: ['id']
            },
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script', 'style', 'object', 'embed', 'iframe'],
            allowCommentTag: false
        };

        return xss(svgContent, svgOptions);
    }

    /**
     * Valida formato de email
     * @param {string} email 
     * @returns {boolean}
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valida formato de teléfono (permite varios formatos)
     * @param {string} phone 
     * @returns {boolean}
     */
    isValidPhone(phone) {
        // Permite formatos: 555-1234, (555) 123-4567, 555.123.4567, +1-555-123-4567, etc.
        const phoneRegex = /^[\+]?[1-9]?[\s\-\.\(\)]*[0-9][\s\-\.\(\)0-9]{6,20}$/;
        return phoneRegex.test(phone);
    }

    /**
     * Valida formato de DNI (permite letras y números)
     * @param {string} dni 
     * @returns {boolean}
     */
    isValidDni(dni) {
        // Permite DNI/CI con formato flexible (letras y números, 6-20 caracteres)
        const dniRegex = /^[A-Za-z0-9\-\.]{6,20}$/;
        return dniRegex.test(dni);
    }

    /**
     * Valida que una fecha esté en el futuro
     * @param {Date|string} date 
     * @returns {boolean}
     */
    isFutureDate(date) {
        const inputDate = new Date(date);
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Comparar solo fechas, no horas

        return inputDate >= now;
    }

    /**
     * Valida que una fecha/hora esté en el futuro
     * @param {Date|string} datetime 
     * @returns {boolean}
     */
    isFutureDateTime(datetime) {
        const inputDateTime = new Date(datetime);
        const now = new Date();

        return inputDateTime > now;
    }

    /**
     * Valida formato de horario (HH:MM)
     * @param {string} time 
     * @returns {boolean}
     */
    isValidTime(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }

    /**
     * Sanitiza texto general removiendo scripts y tags peligrosos
     * @param {string} text 
     * @returns {string}
     */
    sanitizeText(text) {
        if (!text) return text;

        return xss(text, {
            whiteList: {}, // No permitir ningún tag HTML
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script', 'style']
        });
    }

    /**
     * Valida que una contraseña cumpla con los requisitos mínimos
     * @param {string} password 
     * @returns {object} {isValid: boolean, errors: string[]}
     */
    validatePassword(password) {
        const errors = [];

        if (!password || password.length < 8) {
            errors.push('La contraseña debe tener al menos 8 caracteres');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('La contraseña debe contener al menos una letra mayúscula');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('La contraseña debe contener al menos una letra minúscula');
        }

        if (!/\d/.test(password)) {
            errors.push('La contraseña debe contener al menos un número');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Valida rangos de fechas
     * @param {Date|string} startDate 
     * @param {Date|string} endDate 
     * @returns {boolean}
     */
    isValidDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        return start <= end;
    }

    /**
     * Valida rangos de horarios
     * @param {string} startTime - Formato HH:MM
     * @param {string} endTime - Formato HH:MM
     * @returns {boolean}
     */
    isValidTimeRange(startTime, endTime) {
        if (!this.isValidTime(startTime) || !this.isValidTime(endTime)) {
            return false;
        }

        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        return startMinutes < endMinutes;
    }

    /**
     * Limpia y valida parámetros de búsqueda
     * @param {object} params 
     * @returns {object}
     */
    sanitizeSearchParams(params) {
        const cleaned = {};

        Object.keys(params).forEach(key => {
            const value = params[key];

            if (value !== undefined && value !== null && value !== '') {
                // Sanitizar strings
                if (typeof value === 'string') {
                    cleaned[key] = this.sanitizeText(value.trim());
                } else {
                    cleaned[key] = value;
                }
            }
        });

        return cleaned;
    }

    /**
     * Valida que un valor esté en una lista de opciones permitidas
     * @param {any} value 
     * @param {array} allowedValues 
     * @returns {boolean}
     */
    isInAllowedList(value, allowedValues) {
        return allowedValues.includes(value);
    }

    /**
     * Valida días de la semana para bitmask
     * @param {number} daysMask 
     * @returns {boolean}
     */
    isValidDaysMask(daysMask) {
        // daysMask debe ser un número entre 1 y 127 (1111111 en binario)
        return Number.isInteger(daysMask) && daysMask >= 1 && daysMask <= 127;
    }

    /**
     * Convierte días de la semana en array a bitmask
     * @param {array} daysArray - Array de números 1-7 (1=Lunes, 7=Domingo)
     * @returns {number}
     */
    daysArrayToBitmask(daysArray) {
        let mask = 0;
        daysArray.forEach(day => {
            if (day >= 1 && day <= 7) {
                mask |= Math.pow(2, day - 1);
            }
        });
        return mask;
    }

    /**
     * Convierte bitmask a array de días
     * @param {number} daysMask 
     * @returns {array}
     */
    bitmaskToDaysArray(daysMask) {
        const days = [];
        for (let i = 1; i <= 7; i++) {
            if (daysMask & Math.pow(2, i - 1)) {
                days.push(i);
            }
        }
        return days;
    }
}

module.exports = new SecurityService();
