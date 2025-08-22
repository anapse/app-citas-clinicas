const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.SQL_SERVER || 'localhost',
    database: process.env.SQL_DB || 'clinica_db',
    user: process.env.SQL_USER || 'sa',
    password: process.env.SQL_PASSWORD,
    options: {
        encrypt: process.env.SQL_ENCRYPT === 'true',
        trustServerCertificate: true,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

const getPool = async () => {
    if (!pool) {
        try {
            pool = await sql.connect(config);
            console.log('✅ Conexión a SQL Server establecida');
        } catch (error) {
            console.error('❌ Error conectando a SQL Server:', error);
            throw error;
        }
    }
    return pool;
};

const closePool = async () => {
    if (pool) {
        await pool.close();
        pool = null;
        console.log('🔐 Conexión a SQL Server cerrada');
    }
};

module.exports = {
    getPool,
    closePool,
    sql
};
