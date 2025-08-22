const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Importar middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Importar rutas
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const specialtyRoutes = require('./routes/specialties');
const availabilityRoutes = require('./routes/availability');
const appointmentRoutes = require('./routes/appointments');

const app = express();

// ============================================
// CONFIGURACIÓN DE MIDDLEWARE DE SEGURIDAD
// ============================================

// Helmet para seguridad básica
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configuración de CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Lista de orígenes permitidos desde .env
        const allowedOrigins = process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
            : ['http://localhost:5173', 'http://localhost:3000'];

        // Permitir requests sin origin (ej: aplicaciones móviles, Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`🚫 CORS: Origen no permitido: ${origin}`);
            callback(new Error('No permitido por CORS'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// ============================================
// MIDDLEWARE GENERAL
// ============================================

// Logging de requests
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

// Parser de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting general
app.use('/api', apiLimiter);

// ============================================
// RUTAS DE SALUD Y INFO
// ============================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Clinica Citas API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Información de la API
app.get('/api', (req, res) => {
    res.json({
        name: 'Sistema de Control de Citas - API',
        version: '1.0.0',
        description: 'API REST para gestión de citas médicas en clínica',
        endpoints: {
            auth: '/api/auth',
            doctors: '/api/doctors',
            specialties: '/api/specialties',
            availability: '/api/availability',
            appointments: '/api/appointments'
        },
        documentation: '/api/docs',
        health: '/health'
    });
});

// ============================================
// RUTAS PRINCIPALES DE LA API
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);

// ============================================
// DOCUMENTACIÓN DE LA API (OpenAPI)
// ============================================

// Servir documentación OpenAPI
app.get('/api/docs', (req, res) => {
    res.redirect('/openapi.yaml');
});

// Servir archivo OpenAPI YAML
app.get('/openapi.yaml', (req, res) => {
    res.sendFile(require('path').join(__dirname, 'openapi.yaml'));
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada
app.use(notFoundHandler);

// Manejador global de errores
app.use(errorHandler);

// ============================================
// MANEJO DE SEÑALES DE PROCESO
// ============================================

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 SIGTERM recibido, cerrando servidor...');

    try {
        const { closePool } = require('./db/connection');
        await closePool();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante el cierre:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('🔄 SIGINT recibido, cerrando servidor...');

    try {
        const { closePool } = require('./db/connection');
        await closePool();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error durante el cierre:', error);
        process.exit(1);
    }
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('💥 Excepción no capturada:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Promise rechazada no manejada en:', promise, 'razón:', reason);
    process.exit(1);
});

module.exports = app;
