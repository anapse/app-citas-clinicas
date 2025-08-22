const { getPool, sql } = require('../db/connection');

class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
    }

    async findAll(conditions = {}, orderBy = 'id') {
        const pool = await getPool();
        let query = `SELECT * FROM ${this.tableName}`;

        const whereConditions = [];
        const values = [];

        Object.keys(conditions).forEach((key, index) => {
            whereConditions.push(`${key} = @param${index}`);
            values.push({ name: `param${index}`, value: conditions[key] });
        });

        if (whereConditions.length > 0) {
            query += ` WHERE ${whereConditions.join(' AND ')}`;
        }

        query += ` ORDER BY ${orderBy}`;

        const request = pool.request();
        values.forEach(param => {
            request.input(param.name, param.value);
        });

        const result = await request.query(query);
        return result.recordset;
    }

    async findById(id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT * FROM ${this.tableName} WHERE id = @id`);

        return result.recordset[0] || null;
    }

    async create(data) {
        const pool = await getPool();
        const keys = Object.keys(data);
        const values = Object.values(data);

        const placeholders = keys.map((_, index) => `@param${index}`).join(', ');
        const columns = keys.join(', ');

        const query = `
      INSERT INTO ${this.tableName} (${columns}) 
      OUTPUT INSERTED.id 
      VALUES (${placeholders})
    `;

        const request = pool.request();
        values.forEach((value, index) => {
            request.input(`param${index}`, value);
        });

        const result = await request.query(query);
        return result.recordset[0].id;
    }

    async update(id, data) {
        const pool = await getPool();
        const keys = Object.keys(data);
        const setClause = keys.map((key, index) => `${key} = @param${index}`).join(', ');

        const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = @id`;

        const request = pool.request();
        request.input('id', sql.Int, id);

        Object.values(data).forEach((value, index) => {
            request.input(`param${index}`, value);
        });

        const result = await request.query(query);
        return result.rowsAffected[0];
    }

    async delete(id) {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`DELETE FROM ${this.tableName} WHERE id = @id`);

        return result.rowsAffected[0];
    }
}

module.exports = BaseModel;
