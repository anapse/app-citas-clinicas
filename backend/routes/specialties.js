const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const specialtyController = require('../controllers/specialtyController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');

// Validaciones comunes
const specialtyIdValidation = param('id')
    .isInt({ min: 1 })
    .withMessage('ID de especialidad inválido');

const nameValidation = body('name')
    .isLength({ min: 2, max: 100 })
    .trim()
    .withMessage('El nombre debe tener entre 2 y 100 caracteres');

const bookingModeValidation = body('booking_mode')
    .isIn(['SLOT', 'REQUEST', 'WALKIN'])
    .withMessage('Modo de reserva inválido. Debe ser: SLOT, REQUEST o WALKIN');

// GET /api/specialties - Obtener especialidades
router.get('/',
    [
        query('booking_mode')
            .optional()
            .isIn(['SLOT', 'REQUEST', 'WALKIN'])
            .withMessage('Modo de reserva inválido'),
        query('with_doctors')
            .optional()
            .isIn(['true', 'false'])
            .withMessage('with_doctors debe ser true o false')
    ],
    handleValidationErrors,
    specialtyController.getSpecialties
);

// GET /api/specialties/:id - Obtener especialidad por ID
router.get('/:id',
    [specialtyIdValidation],
    handleValidationErrors,
    specialtyController.getSpecialtyById
);

// GET /api/specialties/:id/stats - Obtener estadísticas de la especialidad
router.get('/:id/stats',
    authenticateToken,
    requireRole('admin', 'operador'),
    [specialtyIdValidation],
    handleValidationErrors,
    specialtyController.getSpecialtyStats
);

// POST /api/specialties - Crear nueva especialidad
router.post('/',
    authenticateToken,
    requireRole('admin'),
    [
        nameValidation,
        bookingModeValidation
    ],
    handleValidationErrors,
    specialtyController.createSpecialty
);

// PATCH /api/specialties/:id - Actualizar especialidad
router.patch('/:id',
    authenticateToken,
    requireRole('admin'),
    [
        specialtyIdValidation,
        body('name')
            .optional()
            .isLength({ min: 2, max: 100 })
            .trim()
            .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
        body('booking_mode')
            .optional()
            .isIn(['SLOT', 'REQUEST', 'WALKIN'])
            .withMessage('Modo de reserva inválido. Debe ser: SLOT, REQUEST o WALKIN')
    ],
    handleValidationErrors,
    specialtyController.updateSpecialty
);

// DELETE /api/specialties/:id - Eliminar especialidad
router.delete('/:id',
    authenticateToken,
    requireRole('admin'),
    [specialtyIdValidation],
    handleValidationErrors,
    specialtyController.deleteSpecialty
);

module.exports = router;
