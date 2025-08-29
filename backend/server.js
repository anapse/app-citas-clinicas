const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const citasRoutes = require('./routes/citas');
const doctoresRoutes = require('./routes/doctores');
const especialidadesRoutes = require('./routes/especialidades');
const horariosRoutes = require('./routes/horarios');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Middleware de seguridad
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // máximo 100 requests por IP por ventana
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/doctores', doctoresRoutes);
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/horarios', horariosRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Manejo de errores
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(error.status || 500).json({
        message: error.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 3001;

// Inicializar conexión a la base de datos
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Servidor ejecutándose en puerto ${PORT}`);
            console.log(`Entorno: ${process.env.NODE_ENV}`);
        });
    } catch (error) {
        console.error('Error iniciando el servidor:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
