const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            field: error.path || error.param,
            message: error.msg,
            value: error.value
        }));

        return res.status(400).json({
            error: 'Datos de entrada inválidos',
            code: 'VALIDATION_ERROR',
            details: formattedErrors
        });
    }

    next();
};

// Middleware global para manejo de errores
const errorHandler = (error, req, res, next) => {
    console.error('Error capturado:', error);

    // Error de SQL Server
    if (error.number) {
        switch (error.number) {
            case 2627: // Violación de clave única
            case 2601: // Violación de índice único
                return res.status(409).json({
                    error: 'Conflicto de datos',
                    code: 'DUPLICATE_ENTRY',
                    details: 'El registro ya existe'
                });

            case 547: // Violación de clave foránea
                return res.status(400).json({
                    error: 'Referencias inválidas',
                    code: 'FOREIGN_KEY_VIOLATION',
                    details: 'Referencia a un registro que no existe'
                });

            case 2: // No se puede conectar a SQL Server
                return res.status(503).json({
                    error: 'Servicio no disponible',
                    code: 'DATABASE_UNAVAILABLE',
                    details: 'No se puede conectar a la base de datos'
                });
        }
    }

    // Error de validación personalizado
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: error.message,
            code: 'VALIDATION_ERROR'
        });
    }

    // Error de autenticación JWT
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Token inválido',
            code: 'INVALID_TOKEN'
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expirado',
            code: 'EXPIRED_TOKEN'
        });
    }

    // Error de conflicto de citas
    if (error.message.includes('Ya tienes una cita ese día') ||
        error.message.includes('Ese horario ya fue tomado')) {
        return res.status(409).json({
            error: error.message,
            code: 'APPOINTMENT_CONFLICT'
        });
    }

    // Error personalizado de negocio
    if (error.statusCode) {
        return res.status(error.statusCode).json({
            error: error.message,
            code: error.code || 'BUSINESS_ERROR'
        });
    }

    // Error interno del servidor
    res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
};

// Middleware para rutas no encontradas
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        code: 'NOT_FOUND',
        details: `${req.method} ${req.originalUrl} no existe`
    });
};

module.exports = {
    handleValidationErrors,
    errorHandler,
    notFoundHandler
};
