const express = require('express');
const { body, param, query } = require('express-validator');
const multer = require('multer');
const router = express.Router();

const doctorController = require('../controllers/doctorController');
const { authenticateToken, requireRole, requireSelfOrRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');

// Configuración de multer para subida de archivos
const upload = multer({
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    },
    fileFilter: (req, file, cb) => {
        // Permitir solo imágenes
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'), false);
        }
    }
});

// Validaciones comunes
const doctorIdValidation = param('id')
    .isInt({ min: 1 })
    .withMessage('ID de doctor inválido');

const specialtyIdValidation = body('specialty_id')
    .isInt({ min: 1 })
    .withMessage('ID de especialidad inválido');

// GET /api/doctors - Obtener lista de doctores
router.get('/',
    [
        query('specialtyId')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de especialidad inválido'),
        query('visible')
            .optional()
            .isIn(['0', '1', 'true', 'false'])
            .withMessage('Parámetro visible debe ser 0, 1, true o false')
    ],
    handleValidationErrors,
    doctorController.getDoctors
);

// GET /api/doctors/:id - Obtener doctor por ID
router.get('/:id',
    [doctorIdValidation],
    handleValidationErrors,
    doctorController.getDoctorById
);

// POST /api/doctors/:id/profile - Crear/actualizar perfil completo
router.post('/:id/profile',
    authenticateToken,
    requireSelfOrRole('admin', 'operador'),
    [
        doctorIdValidation,
        body('primary_specialty_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de especialidad primaria inválido'),
        body('title_prefix')
            .optional()
            .isLength({ max: 30 })
            .trim()
            .withMessage('Prefijo de título muy largo (máximo 30 caracteres)'),
        body('description_short')
            .optional()
            .isLength({ max: 200 })
            .trim()
            .withMessage('Descripción corta muy larga (máximo 200 caracteres)'),
        body('description_long')
            .optional()
            .isLength({ max: 4000 })
            .trim()
            .withMessage('Descripción larga muy larga (máximo 4000 caracteres)'),
        body('is_visible')
            .optional()
            .isBoolean()
            .withMessage('is_visible debe ser booleano'),
        body('sort_order')
            .optional()
            .isInt({ min: 0 })
            .withMessage('sort_order debe ser un entero positivo')
    ],
    handleValidationErrors,
    doctorController.createDoctorProfile
);

// PATCH /api/doctors/:id/profile - Actualizar perfil parcial
router.patch('/:id/profile',
    authenticateToken,
    requireSelfOrRole('admin', 'operador'),
    [
        doctorIdValidation,
        body('primary_specialty_id')
            .optional()
            .isInt({ min: 1 })
            .withMessage('ID de especialidad primaria inválido'),
        body('title_prefix')
            .optional()
            .isLength({ max: 30 })
            .trim()
            .withMessage('Prefijo de título muy largo (máximo 30 caracteres)'),
        body('description_short')
            .optional()
            .isLength({ max: 200 })
            .trim()
            .withMessage('Descripción corta muy larga (máximo 200 caracteres)'),
        body('description_long')
            .optional()
            .isLength({ max: 4000 })
            .trim()
            .withMessage('Descripción larga muy larga (máximo 4000 caracteres)'),
        body('is_visible')
            .optional()
            .isBoolean()
            .withMessage('is_visible debe ser booleano'),
        body('sort_order')
            .optional()
            .isInt({ min: 0 })
            .withMessage('sort_order debe ser un entero positivo')
    ],
    handleValidationErrors,
    doctorController.updateDoctorProfile
);

// POST /api/doctors/:id/photo - Subir foto del doctor
router.post('/:id/photo',
    authenticateToken,
    requireSelfOrRole('admin', 'operador'),
    upload.single('photo'),
    [doctorIdValidation],
    handleValidationErrors,
    doctorController.updateDoctorPhoto
);

// PATCH /api/doctors/:id/photoSvg - Actualizar SVG del doctor
router.patch('/:id/photoSvg',
    authenticateToken,
    requireSelfOrRole('admin', 'operador'),
    [
        doctorIdValidation,
        body('svg_content')
            .notEmpty()
            .withMessage('Contenido SVG requerido')
            .isLength({ max: 50000 })
            .withMessage('Contenido SVG muy largo (máximo 50KB)')
    ],
    handleValidationErrors,
    doctorController.updateDoctorPhotoSvg
);

// POST /api/doctors/:id/specialties - Agregar especialidad al doctor
router.post('/:id/specialties',
    authenticateToken,
    requireRole('admin', 'operador'),
    [
        doctorIdValidation,
        specialtyIdValidation
    ],
    handleValidationErrors,
    doctorController.addSpecialty
);

// DELETE /api/doctors/:id/specialties/:specialtyId - Remover especialidad del doctor
router.delete('/:id/specialties/:specialtyId',
    authenticateToken,
    requireRole('admin', 'operador'),
    [
        doctorIdValidation,
        param('specialtyId')
            .isInt({ min: 1 })
            .withMessage('ID de especialidad inválido')
    ],
    handleValidationErrors,
    doctorController.removeSpecialty
);

// Middleware para manejar errores de multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'Archivo muy grande. Máximo 5MB',
                code: 'FILE_TOO_LARGE'
            });
        }
    } else if (error.message === 'Solo se permiten archivos de imagen') {
        return res.status(400).json({
            error: 'Tipo de archivo no válido. Solo se permiten imágenes',
            code: 'INVALID_FILE_TYPE'
        });
    }
    next(error);
});

module.exports = router;
