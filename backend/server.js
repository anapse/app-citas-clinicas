const app = require('./app');
const { getPool } = require('./db/connection');

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        // Verificar conexión a la base de datos
        console.log('🔌 Verificando conexión a SQL Server...');
        await getPool();

        // Iniciar servidor
        const server = app.listen(PORT, () => {
            console.log('🚀 Servidor iniciado exitosamente');
            console.log(`📍 Puerto: ${PORT}`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`📖 API info: http://localhost:${PORT}/api`);
            console.log(`📚 Documentación: http://localhost:${PORT}/api/docs`);
            console.log('════════════════════════════════════════════════════');
        });

        // Configurar timeout del servidor
        server.timeout = 30000; // 30 segundos

        // Manejar errores del servidor
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Puerto ${PORT} ya está en uso`);
                process.exit(1);
            } else {
                console.error('❌ Error del servidor:', error);
                process.exit(1);
            }
        });

        return server;

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);

        if (error.code === 'ECONNREFUSED' || error.originalError?.code === 'ECONNREFUSED') {
            console.error('💡 Verifique que SQL Server esté ejecutándose y las credenciales en .env sean correctas');
        }

        process.exit(1);
    }
}

// Iniciar servidor solo si este archivo se ejecuta directamente
if (require.main === module) {
    startServer().catch(error => {
        console.error('💥 Error fatal al iniciar:', error);
        process.exit(1);
    });
}

module.exports = { startServer };
