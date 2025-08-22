const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Token de acceso requerido',
                code: 'MISSING_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Obtener datos actualizados del usuario
        const user = await User.findWithRole(decoded.userId);
        if (!user) {
            return res.status(401).json({
                error: 'Usuario no encontrado',
                code: 'USER_NOT_FOUND'
            });
        }

        req.user = {
            id: user.id,
            email: user.email,
            role: user.role_name,
            roleId: user.role_id,
            fullName: user.full_name
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                error: 'Token inválido',
                code: 'INVALID_TOKEN'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(403).json({
                error: 'Token expirado',
                code: 'EXPIRED_TOKEN'
            });
        }

        console.error('Error en autenticación:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            code: 'INTERNAL_ERROR'
        });
    }
};

const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Autenticación requerida',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Permisos insuficientes',
                code: 'INSUFFICIENT_PERMISSIONS',
                details: `Requiere uno de los roles: ${allowedRoles.join(', ')}`
            });
        }

        next();
    };
};

const requireSelfOrRole = (...allowedRoles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Autenticación requerida',
                code: 'AUTH_REQUIRED'
            });
        }

        // Si tiene uno de los roles permitidos, puede acceder
        if (allowedRoles.includes(req.user.role)) {
            return next();
        }

        // Si es doctor, verificar que está accediendo a sus propios recursos
        if (req.user.role === 'doctor') {
            const Doctor = require('../models/Doctor');
            const doctor = await Doctor.findByUserId(req.user.id);

            if (doctor) {
                // Verificar si el recurso le pertenece (basado en doctorId en params)
                const doctorId = req.params.id || req.params.doctorId;
                if (doctorId && parseInt(doctorId) === doctor.id) {
                    return next();
                }
            }
        }

        return res.status(403).json({
            error: 'No tienes permisos para acceder a este recurso',
            code: 'ACCESS_DENIED'
        });
    };
};

// Middleware opcional - no requiere autenticación pero la procesa si está presente
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findWithRole(decoded.userId);

            if (user) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role_name,
                    roleId: user.role_id,
                    fullName: user.full_name
                };
            }
        }

        next();
    } catch (error) {
        // En el middleware opcional, los errores de token no son fatales
        next();
    }
};

module.exports = {
    authenticateToken,
    requireRole,
    requireSelfOrRole,
    optionalAuth
};
