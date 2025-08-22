const { getPool, sql } = require('../db/connection');
const BaseModel = require('./BaseModel');

class Role extends BaseModel {
    constructor() {
        super('roles');
    }

    async findByName(name) {
        const pool = await getPool();
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .query('SELECT * FROM roles WHERE name = @name');

        return result.recordset[0] || null;
    }

    async getAllRoles() {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT * FROM roles ORDER BY id');

        return result.recordset;
    }
}

module.exports = new Role();
