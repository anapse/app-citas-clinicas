const { connectDB, sql } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    try {
        console.log('🔄 Conectando a la base de datos...');
        await connectDB();

        console.log('🔄 Ejecutando script de creación de tablas...');
        const createTablesScript = fs.readFileSync(
            path.join(__dirname, 'database', 'create_tables.sql'),
            'utf8'
        );

        // Dividir el script en comandos individuales
        const commands = createTablesScript
            .split('GO')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0);

        for (const command of commands) {
            if (command.trim()) {
                await sql.query(command);
            }
        }

        console.log('✅ Tablas creadas exitosamente');

        console.log('🔄 Insertando datos iniciales...');
        const insertDataScript = fs.readFileSync(
            path.join(__dirname, 'database', 'insert_initial_data.sql'),
            'utf8'
        );

        const dataCommands = insertDataScript
            .split('GO')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0);

        for (const command of dataCommands) {
            if (command.trim()) {
                await sql.query(command);
            }
        }

        console.log('✅ Datos iniciales insertados exitosamente');
        console.log('');
        console.log('🎉 Base de datos inicializada correctamente!');
        console.log('');
        console.log('Credenciales por defecto:');
        console.log('👤 Admin: admin@clinica.com / password');
        console.log('👤 Moderador: moderador@clinica.com / password');
        console.log('👤 Doctores: dr.cairo@clinica.com, dra.perez@clinica.com, dr.ruiz@clinica.com / password');
        console.log('');

    } catch (error) {
        console.error('❌ Error inicializando la base de datos:', error);
        console.error('');
        console.error('Asegúrate de que:');
        console.error('1. SQL Server esté ejecutándose');
        console.error('2. Las credenciales en .env sean correctas');
        console.error('3. El usuario tenga permisos para crear bases de datos');
        process.exit(1);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
