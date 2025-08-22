const rateLimit = require('express-rate-limit');

// Rate limiter para rutas de autenticación
const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 10, // 10 intentos por IP
    message: {
        error: 'Demasiados intentos de inicio de sesión',
        code: 'TOO_MANY_ATTEMPTS',
        details: 'Intenta nuevamente en 5 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Saltar rate limiting en desarrollo
        return process.env.NODE_ENV === 'development';
    }
});

// Rate limiter para rutas públicas de creación
const publicCreateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 30, // 30 requests por IP
    message: {
        error: 'Demasiadas solicitudes',
        code: 'TOO_MANY_REQUESTS',
        details: 'Intenta nuevamente en 5 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return process.env.NODE_ENV === 'development';
    }
});

// Rate limiter general para API
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 100, // 100 requests por IP por minuto
    message: {
        error: 'Límite de solicitudes excedido',
        code: 'RATE_LIMIT_EXCEEDED',
        details: 'Demasiadas solicitudes desde esta IP'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        return process.env.NODE_ENV === 'development';
    }
});

module.exports = {
    authLimiter,
    publicCreateLimiter,
    apiLimiter
};
