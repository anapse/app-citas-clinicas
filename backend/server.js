const app = require('./app');
const { getPool } = require('./db/connection');

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        // Intentar conexión a la base de datos (opcional)
        console.log('🔌 Verificando conexión a SQL Server...');
        try {
            await getPool();
            console.log('✅ Conexión a SQL Server exitosa');
        } catch (dbError) {
            console.warn('⚠️ No se pudo conectar a SQL Server, continuando sin BD:', dbError.message);
            console.warn('💡 El API funcionará en modo limitado sin persistencia');
        }

        // Iniciar servidor
        const server = app.listen(PORT, '0.0.0.0', () => {
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
