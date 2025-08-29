require('dotenv').config();

const sql = require('mssql');

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
        requestTimeout: 30000,
        connectionTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool;

const connectDB = async () => {
    try {
        if (!pool) {
            pool = await sql.connect(config);
            console.log('✅ Conectado a SQL Server');
        }
        return pool;
    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error);
        throw error;
    }
};

const getPool = () => {
    if (!pool) {
        throw new Error('Base de datos no conectada');
    }
    return pool;
};

const closeDB = async () => {
    try {
        if (pool) {
            await pool.close();
            pool = null;
            console.log('Conexión a la base de datos cerrada');
        }
    } catch (error) {
        console.error('Error cerrando la base de datos:', error);
    }
};

module.exports = {
    connectDB,
    getPool,
    closeDB,
    sql
};
