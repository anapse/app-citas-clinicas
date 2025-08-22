const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const appointmentController = require('../controllers/appointmentController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { publicCreateLimiter } = require('../middleware/rateLimiter');

// Validaciones comunes
const appointmentIdValidation = param('id')
    .isInt({ min: 1 })
    .withMessage('ID de cita inválido');

const patientValidation = [
    body('patient.name')
        .isLength({ min: 2, max: 150 })
        .trim()
        .withMessage('Nombre del paciente debe tener entre 2 y 150 caracteres'),
    body('patient.dni')
        .isLength({ min: 6, max: 20 })
        .matches(/^[A-Za-z0-9\-\.]+$/)
        .withMessage('DNI debe tener entre 6-20 caracteres alfanuméricos'),
    body('patient.birthdate')
        .isISO8601()
        .toDate()
        .withMessage('Fecha de nacimiento inválida'),
    body('patient.phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('Número de teléfono inválido')
];

const datetimeValidation = [
    body('start')
        .isISO8601()
        .toDate()
        .withMessage('Fecha y hora de inicio inválida'),
    body('end')
        .isISO8601()
        .toDate()
        .withMessage('Fecha y hora de fin inválida')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.start)) {
                throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
            }
            return true;
        })
];

// GET /api/appointments - Obtener citas con filtros
router.get('/',
    authenticateToken,
    [
        query('from')
            .optional()
            .isISO8601()
            .withMessage('Fecha "from" inválida (formato ISO8601)'),
        query('to')
            .optional()
            .isISO8601()
            .withMessage('Fecha "to" inválida (formato ISO8601)'),
        query('doctorId')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de doctor inválido'),
        query('specialtyId')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de especialidad inválido'),
        query('dni')
            .optional()
            .isLength({ min: 6, max: 20 })
            .withMessage('DNI inválido'),
        query('status')
            .optional()
            .isIn(['booked', 'confirmed', 'checked_in', 'cancelled'])
            .withMessage('Estado inválido')
    ],
    handleValidationErrors,
    appointmentController.getAppointments
);

// GET /api/appointments/me - Obtener mis citas (paciente o doctor)
router.get('/me',
    authenticateToken,
    appointmentController.getMyAppointments
);

// GET /api/appointments/:id - Obtener cita por ID
router.get('/:id',
    authenticateToken,
    [appointmentIdValidation],
    handleValidationErrors,
    appointmentController.getAppointmentById
);

// POST /api/appointments - Crear nueva cita
router.post('/',
    publicCreateLimiter, // Rate limiting para creación pública
    optionalAuth, // Permite crear citas sin autenticación (pacientes nuevos)
    [
        body('specialty_id')
            .isInt({ min: 1 })
            .withMessage('ID de especialidad requerido y válido'),
        body('doctor_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de doctor debe ser válido'),
        ...patientValidation,
        ...datetimeValidation
    ],
    handleValidationErrors,
    appointmentController.createAppointment
);

// PATCH /api/appointments/:id/status - Actualizar estado de cita
router.patch('/:id/status',
    authenticateToken,
    requireRole('admin', 'operador', 'doctor'),
    [
        appointmentIdValidation,
        body('status')
            .isIn(['booked', 'confirmed', 'checked_in', 'cancelled'])
            .withMessage('Estado inválido. Valores permitidos: booked, confirmed, checked_in, cancelled')
    ],
    handleValidationErrors,
    appointmentController.updateAppointmentStatus
);

// DELETE /api/appointments/:id - Cancelar cita
router.delete('/:id',
    authenticateToken,
    [appointmentIdValidation],
    handleValidationErrors,
    appointmentController.cancelAppointment
);

module.exports = router;
