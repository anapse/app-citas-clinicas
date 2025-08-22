const express = require('express');
const { query, param } = require('express-validator');
const router = express.Router();

const availabilityController = require('../controllers/availabilityController');
const { handleValidationErrors } = require('../middleware/errorHandler');

// GET /api/availability - Obtener disponibilidad por especialidad y fecha
router.get('/',
    [
        query('specialtyId')
            .notEmpty()
            .isInt({ min: 1 })
            .withMessage('ID de especialidad requerido y debe ser un número válido'),
        query('doctorId')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de doctor debe ser un número válido'),
        query('date')
            .notEmpty()
            .matches(/^\d{4}-\d{2}-\d{2}$/)
            .withMessage('Fecha requerida en formato YYYY-MM-DD')
            .custom((value) => {
                const date = new Date(value + 'T00:00:00');
                if (isNaN(date.getTime())) {
                    throw new Error('Fecha inválida');
                }
                return true;
            })
    ],
    handleValidationErrors,
    availabilityController.getAvailability
);

// GET /api/availability/weekly - Obtener disponibilidad semanal
router.get('/weekly',
    [
        query('specialtyId')
            .notEmpty()
            .isInt({ min: 1 })
            .withMessage('ID de especialidad requerido y debe ser un número válido'),
        query('doctorId')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de doctor debe ser un número válido')
    ],
    handleValidationErrors,
    availabilityController.getWeeklyAvailability
);

// GET /api/availability/doctor/:doctorId - Obtener disponibilidad por doctor
router.get('/doctor/:doctorId',
    [
        param('doctorId')
            .isInt({ min: 1 })
            .withMessage('ID de doctor inválido'),
        query('date')
            .notEmpty()
            .matches(/^\d{4}-\d{2}-\d{2}$/)
            .withMessage('Fecha requerida en formato YYYY-MM-DD'),
        query('specialtyId')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de especialidad debe ser un número válido')
    ],
    handleValidationErrors,
    availabilityController.getAvailabilityByDoctor
);

module.exports = router;
