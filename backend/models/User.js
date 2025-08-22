const { getPool, sql } = require('../db/connection');
const BaseModel = require('./BaseModel');

class User extends BaseModel {
    constructor() {
        super('users');
    }

    async findByEmail(email) {
        const pool = await getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query(`
        SELECT u.*, r.name as role_name 
        FROM users u 
        INNER JOIN roles r ON u.role_id = r.id 
        WHERE u.email = @email
      `);

        return result.recordset[0] || null;
    }

    async findByDni(dni) {
        const pool = await getPool();
        const result = await pool.request()
            .input('dni', sql.NVarChar, dni)
            .query('SELECT * FROM users WHERE dni = @dni');

        return result.recordset[0] || null;
    }

    async findWithRole(id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
        SELECT u.*, r.name as role_name 
        FROM users u 
        INNER JOIN roles r ON u.role_id = r.id 
        WHERE u.id = @id
      `);

        return result.recordset[0] || null;
    }

    async findByRole(roleName) {
        const pool = await getPool();
        const result = await pool.request()
            .input('roleName', sql.NVarChar, roleName)
            .query(`
        SELECT u.*, r.name as role_name 
        FROM users u 
        INNER JOIN roles r ON u.role_id = r.id 
        WHERE r.name = @roleName
        ORDER BY u.full_name
      `);

        return result.recordset;
    }

    async createUser(userData) {
        const pool = await getPool();
        const { full_name, email, phone, dni, password_hash, role_id } = userData;

        const result = await pool.request()
            .input('full_name', sql.NVarChar, full_name)
            .input('email', sql.NVarChar, email)
            .input('phone', sql.NVarChar, phone || null)
            .input('dni', sql.NVarChar, dni || null)
            .input('password_hash', sql.NVarChar, password_hash)
            .input('role_id', sql.Int, role_id)
            .query(`
        INSERT INTO users (full_name, email, phone, dni, password_hash, role_id)
        OUTPUT INSERTED.id, INSERTED.full_name, INSERTED.email, INSERTED.phone, INSERTED.dni, INSERTED.role_id, INSERTED.created_at
        VALUES (@full_name, @email, @phone, @dni, @password_hash, @role_id)
      `);

        return result.recordset[0];
    }
}

module.exports = new User();
