/**
 * Validar campo requerido
 */
export const required = (value, fieldName = 'Campo') => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
        return `${fieldName} es requerido`;
    }
    return null;
};

/**
 * Validar longitud mínima y máxima de texto
 */
export const length = (value, min = 0, max = Infinity, fieldName = 'Campo') => {
    if (!value) return null;

    const len = value.toString().length;

    if (len < min) {
        return `${fieldName} debe tener al menos ${min} caracteres`;
    }

    if (len > max) {
        return `${fieldName} no puede tener más de ${max} caracteres`;
    }

    return null;
};

/**
 * Validar DNI peruano (8 dígitos)
 */
export const dni = (value) => {
    if (!value) return null;

    const dniRegex = /^\d{8}$/;

    if (!dniRegex.test(value)) {
        return 'DNI debe tener exactamente 8 dígitos';
    }

    return null;
};

/**
 * Validar teléfono (7-12 dígitos)
 */
export const phone = (value) => {
    if (!value) return null;

    const phoneRegex = /^\d{7,12}$/;

    if (!phoneRegex.test(value.toString().replace(/[\s\-\(\)]/g, ''))) {
        return 'Teléfono debe tener entre 7 y 12 dígitos';
    }

    return null;
};

/**
 * Validar email
 */
export const email = (value) => {
    if (!value) return null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
        return 'Email debe tener un formato válido';
    }

    return null;
};

/**
 * Validar fecha de nacimiento
 */
export const birthdate = (value) => {
    if (!value) return null;

    const date = new Date(value);
    const today = new Date();

    // Verificar que sea una fecha válida
    if (isNaN(date.getTime())) {
        return 'Fecha de nacimiento no es válida';
    }

    // Verificar que no sea en el futuro
    if (date > today) {
        return 'Fecha de nacimiento no puede ser en el futuro';
    }

    // Verificar que no sea muy antigua (más de 120 años)
    const maxAge = new Date();
    maxAge.setFullYear(maxAge.getFullYear() - 120);

    if (date < maxAge) {
        return 'Fecha de nacimiento no puede ser anterior a 120 años';
    }

    return null;
};

/**
 * Validar contraseña
 */
export const password = (value) => {
    if (!value) return null;

    if (value.length < 6) {
        return 'Contraseña debe tener al menos 6 caracteres';
    }

    return null;
};

/**
 * Validar confirmación de contraseña
 */
export const passwordConfirm = (value, originalPassword) => {
    if (!value) return null;

    if (value !== originalPassword) {
        return 'Las contraseñas no coinciden';
    }

    return null;
};

/**
 * Validar fecha (formato YYYY-MM-DD)
 */
export const date = (value) => {
    if (!value) return null;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(value)) {
        return 'Fecha debe tener formato YYYY-MM-DD';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return 'Fecha no es válida';
    }

    return null;
};

/**
 * Validar hora (formato HH:MM)
 */
export const time = (value) => {
    if (!value) return null;

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!timeRegex.test(value)) {
        return 'Hora debe tener formato HH:MM';
    }

    return null;
};

/**
 * Validar número
 */
export const number = (value, min = -Infinity, max = Infinity) => {
    if (!value && value !== 0) return null;

    const num = parseFloat(value);

    if (isNaN(num)) {
        return 'Debe ser un número válido';
    }

    if (num < min) {
        return `Debe ser mayor o igual a ${min}`;
    }

    if (num > max) {
        return `Debe ser menor o igual a ${max}`;
    }

    return null;
};

/**
 * Validar entero positivo
 */
export const positiveInteger = (value) => {
    if (!value && value !== 0) return null;

    const num = parseInt(value);

    if (isNaN(num) || num !== parseFloat(value)) {
        return 'Debe ser un número entero';
    }

    if (num < 0) {
        return 'Debe ser un número positivo';
    }

    return null;
};

/**
 * Validar múltiples reglas
 */
export const validate = (value, rules = [], fieldName = 'Campo') => {
    for (const rule of rules) {
        let error = null;

        if (typeof rule === 'function') {
            error = rule(value);
        } else if (typeof rule === 'object') {
            const { type, params = [] } = rule;

            switch (type) {
                case 'required':
                    error = required(value, fieldName);
                    break;
                case 'length':
                    error = length(value, params[0], params[1], fieldName);
                    break;
                case 'dni':
                    error = dni(value);
                    break;
                case 'phone':
                    error = phone(value);
                    break;
                case 'email':
                    error = email(value);
                    break;
                case 'birthdate':
                    error = birthdate(value);
                    break;
                case 'password':
                    error = password(value);
                    break;
                case 'date':
                    error = date(value);
                    break;
                case 'time':
                    error = time(value);
                    break;
                case 'number':
                    error = number(value, params[0], params[1]);
                    break;
                case 'positiveInteger':
                    error = positiveInteger(value);
                    break;
                default:
                    console.warn(`Regla de validación desconocida: ${type}`);
            }
        }

        if (error) {
            return error;
        }
    }

    return null;
};

/**
 * Validar formulario completo
 */
export const validateForm = (data, schema) => {
    const errors = {};
    let hasErrors = false;

    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        const error = validate(value, rules, field);

        if (error) {
            errors[field] = error;
            hasErrors = true;
        }
    }

    return { errors, hasErrors };
};

/**
 * Esquemas de validación predefinidos
 */
export const schemas = {
    reserva: {
        nombre: [
            { type: 'required' },
            { type: 'length', params: [2, 120] }
        ],
        dni: [
            { type: 'required' },
            { type: 'dni' }
        ],
        birthdate: [
            { type: 'required' },
            { type: 'birthdate' }
        ],
        phone: [
            { type: 'required' },
            { type: 'phone' }
        ]
    },

    solicitud: {
        nombre: [
            { type: 'required' },
            { type: 'length', params: [2, 120] }
        ],
        dni: [
            { type: 'required' },
            { type: 'dni' }
        ],
        birthdate: [
            { type: 'required' },
            { type: 'birthdate' }
        ],
        phone: [
            { type: 'required' },
            { type: 'phone' }
        ],
        note: [
            { type: 'length', params: [0, 500] }
        ]
    },

    login: {
        email: [
            { type: 'required' },
            { type: 'email' }
        ],
        password: [
            { type: 'required' },
            { type: 'password' }
        ]
    }
};
