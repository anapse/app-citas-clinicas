/**
 * Máscaras de entrada para formularios
 * Funciones para formatear input mientras el usuario escribe
 */

/**
 * Máscara para DNI peruano (8 dígitos)
 * Solo permite números y máximo 8 caracteres
 * @param {string} value 
 * @returns {string}
 */
export const maskDni = (value) => {
    if (!value) return '';

    // Remover todos los caracteres que no sean números
    const numbersOnly = value.replace(/\D/g, '');

    // Limitar a 8 dígitos
    return numbersOnly.slice(0, 8);
};

/**
 * Máscara para teléfono peruano
 * Permite números, espacios, guiones y paréntesis
 * Formatea automáticamente según longitud
 * @param {string} value 
 * @returns {string}
 */
export const maskPhone = (value) => {
    if (!value) return '';

    // Remover todos los caracteres que no sean números
    const numbersOnly = value.replace(/\D/g, '');

    // Limitar a 12 dígitos
    const limited = numbersOnly.slice(0, 12);

    // Formatear según longitud
    if (limited.length <= 7) {
        // Teléfono fijo local: 123-4567
        return limited.replace(/(\d{3})(\d{0,4})/, (match, p1, p2) => {
            return p2 ? `${p1}-${p2}` : p1;
        });
    } else if (limited.length <= 9) {
        // Teléfono celular: 987-654-321
        return limited.replace(/(\d{3})(\d{3})(\d{0,3})/, (match, p1, p2, p3) => {
            return p3 ? `${p1}-${p2}-${p3}` : p2 ? `${p1}-${p2}` : p1;
        });
    } else {
        // Teléfono con código: +51-987-654-321
        return limited.replace(/(\d{1,2})(\d{3})(\d{3})(\d{0,3})/, (match, p1, p2, p3, p4) => {
            return p4 ? `+${p1}-${p2}-${p3}-${p4}` : p3 ? `+${p1}-${p2}-${p3}` : p2 ? `+${p1}-${p2}` : `+${p1}`;
        });
    }
};

/**
 * Máscara para nombres (solo letras, espacios y acentos)
 * @param {string} value 
 * @returns {string}
 */
export const maskName = (value) => {
    if (!value) return '';

    // Solo permitir letras, espacios, acentos y caracteres del español
    return value.replace(/[^a-zA-ZáéíóúüÁÉÍÓÚÜñÑ\s]/g, '')
        // Capitalizar primera letra de cada palabra
        .replace(/\b\w/g, letter => letter.toUpperCase())
        // Limitar espacios múltiples
        .replace(/\s+/g, ' ')
        // Limitar a 120 caracteres
        .slice(0, 120);
};

/**
 * Máscara para email (convertir a minúsculas, remover espacios)
 * @param {string} value 
 * @returns {string}
 */
export const maskEmail = (value) => {
    if (!value) return '';

    return value
        .toLowerCase()
        .replace(/\s/g, '')
        .slice(0, 254); // Límite RFC para emails
};

/**
 * Máscara para hora (formato HH:MM)
 * @param {string} value 
 * @returns {string}
 */
export const maskTime = (value) => {
    if (!value) return '';

    // Solo números
    const numbersOnly = value.replace(/\D/g, '');

    // Formatear HH:MM
    if (numbersOnly.length >= 2) {
        const hours = numbersOnly.slice(0, 2);
        const minutes = numbersOnly.slice(2, 4);

        // Validar horas (00-23)
        const validHours = Math.min(parseInt(hours), 23).toString().padStart(2, '0');

        if (minutes) {
            // Validar minutos (00-59)
            const validMinutes = Math.min(parseInt(minutes), 59).toString().padStart(2, '0');
            return `${validHours}:${validMinutes}`;
        }

        return validHours;
    }

    return numbersOnly;
};

/**
 * Máscara para números positivos
 * @param {string} value 
 * @param {number} maxDigits 
 * @returns {string}
 */
export const maskPositiveNumber = (value, maxDigits = 10) => {
    if (!value) return '';

    return value
        .replace(/[^\d]/g, '') // Solo números
        .slice(0, maxDigits);
};

/**
 * Máscara para números decimales
 * @param {string} value 
 * @param {number} maxDecimals 
 * @returns {string}
 */
export const maskDecimal = (value, maxDecimals = 2) => {
    if (!value) return '';

    // Permitir números y un punto decimal
    let cleaned = value.replace(/[^\d.]/g, '');

    // Solo un punto decimal
    const parts = cleaned.split('.');
    if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
    }

    // Limitar decimales
    if (parts.length === 2) {
        cleaned = parts[0] + '.' + parts[1].slice(0, maxDecimals);
    }

    return cleaned;
};

/**
 * Aplicar máscara según el tipo de input
 * @param {string} value 
 * @param {string} type 
 * @param {object} options 
 * @returns {string}
 */
export const applyMask = (value, type, options = {}) => {
    switch (type) {
        case 'dni':
            return maskDni(value);

        case 'phone':
            return maskPhone(value);

        case 'name':
            return maskName(value);

        case 'email':
            return maskEmail(value);

        case 'time':
            return maskTime(value);

        case 'positiveNumber':
            return maskPositiveNumber(value, options.maxDigits);

        case 'decimal':
            return maskDecimal(value, options.maxDecimals);

        default:
            return value;
    }
};

/**
 * Limpiar valor para envío al servidor
 * Remueve formato de máscaras para obtener valor crudo
 * @param {string} value 
 * @param {string} type 
 * @returns {string}
 */
export const unmask = (value, type) => {
    if (!value) return '';

    switch (type) {
        case 'dni':
            return value.replace(/\D/g, '');

        case 'phone':
            return value.replace(/[\s\-\(\)\+]/g, '');

        case 'name':
            return value.trim();

        case 'email':
            return value.toLowerCase().trim();

        case 'positiveNumber':
            return value.replace(/\D/g, '');

        case 'decimal':
            return value;

        default:
            return value;
    }
};

/**
 * Hook personalizado para usar máscaras en inputs
 * @param {string} initialValue 
 * @param {string} maskType 
 * @param {object} options 
 * @returns {object}
 */
export const useMask = (initialValue = '', maskType, options = {}) => {
    const [value, setValue] = React.useState(applyMask(initialValue, maskType, options));

    const handleChange = (e) => {
        const inputValue = e.target.value;
        const maskedValue = applyMask(inputValue, maskType, options);
        setValue(maskedValue);

        // Llamar onChange personalizado si existe
        if (options.onChange) {
            options.onChange({
                ...e,
                target: {
                    ...e.target,
                    value: maskedValue,
                    rawValue: unmask(maskedValue, maskType)
                }
            });
        }
    };

    const getRawValue = () => unmask(value, maskType);

    return {
        value,
        onChange: handleChange,
        rawValue: getRawValue()
    };
};

/**
 * Placeholders sugeridos para cada tipo de máscara
 */
export const placeholders = {
    dni: '12345678',
    phone: '987-654-321',
    name: 'Juan Pérez García',
    email: 'correo@ejemplo.com',
    time: '14:30',
    positiveNumber: '123',
    decimal: '123.45'
};

/**
 * Patrones para validación HTML5
 */
export const patterns = {
    dni: '[0-9]{8}',
    phone: '[0-9+\\-\\s\\(\\)]{7,15}',
    name: '[a-zA-ZáéíóúüÁÉÍÓÚÜñÑ\\s]{2,120}',
    email: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    time: '[0-2][0-9]:[0-5][0-9]'
};
