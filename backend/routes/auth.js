const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { authLimiter } = require('../middleware/rateLimiter');

// Validaciones comunes
const emailValidation = body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido');

const passwordValidation = body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una minúscula, una mayúscula y un número');

const nameValidation = body('full_name')
    .isLength({ min: 2, max: 150 })
    .trim()
    .withMessage('El nombre debe tener entre 2 y 150 caracteres');

const phoneValidation = body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Número de teléfono inválido');

const dniValidation = body('dni')
    .optional()
    .isLength({ min: 6, max: 20 })
    .matches(/^[A-Za-z0-9\-\.]+$/)
    .withMessage('DNI debe tener entre 6-20 caracteres alfanuméricos');

// POST /api/auth/register - Registro de usuarios
router.post('/register',
    authLimiter,
    optionalAuth, // Para verificar si es admin
    [
        nameValidation,
        emailValidation,
        phoneValidation,
        dniValidation,
        passwordValidation,
        body('role')
            .optional()
            .isIn(['admin', 'operador', 'doctor', 'paciente'])
            .withMessage('Rol inválido')
    ],
    handleValidationErrors,
    authController.register
);

// POST /api/auth/login - Inicio de sesión
router.post('/login',
    authLimiter,
    [
        emailValidation,
        body('password')
            .notEmpty()
            .withMessage('Contraseña requerida')
    ],
    handleValidationErrors,
    authController.login
);

// GET /api/auth/me - Obtener perfil del usuario autenticado
router.get('/me',
    authenticateToken,
    authController.me
);

// PATCH /api/auth/profile - Actualizar perfil
router.patch('/profile',
    authenticateToken,
    [
        body('full_name')
            .optional()
            .isLength({ min: 2, max: 150 })
            .trim()
            .withMessage('El nombre debe tener entre 2 y 150 caracteres'),
        phoneValidation
    ],
    handleValidationErrors,
    authController.updateProfile
);

// PATCH /api/auth/password - Cambiar contraseña
router.patch('/password',
    authenticateToken,
    [
        body('current_password')
            .notEmpty()
            .withMessage('Contraseña actual requerida'),
        body('new_password')
            .isLength({ min: 8 })
            .withMessage('La nueva contraseña debe tener al menos 8 caracteres')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('La nueva contraseña debe contener al menos una minúscula, una mayúscula y un número')
    ],
    handleValidationErrors,
    authController.changePassword
);

module.exports = router;
