const { getPool, sql } = require('../db/connection');
const BaseModel = require('./BaseModel');

class Doctor extends BaseModel {
    constructor() {
        super('doctors');
    }

    async findByUserId(userId) {
        const pool = await getPool();
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
        SELECT 
          d.*,
          u.full_name,
          u.email,
          u.phone,
          u.dni
        FROM doctors d
        INNER JOIN users u ON d.user_id = u.id
        WHERE d.user_id = @userId
      `);

        return result.recordset[0] || null;
    }

    async findWithProfile(doctorId) {
        const pool = await getPool();
        const result = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .query(`
        SELECT 
          d.*,
          u.full_name,
          u.email,
          u.phone,
          u.dni,
          dp.primary_specialty_id,
          dp.title_prefix,
          dp.description_short,
          dp.description_long,
          dp.photo_url,
          dp.photo_svg,
          dp.has_image,
          dp.is_visible,
          dp.sort_order,
          s.name as primary_specialty_name
        FROM doctors d
        INNER JOIN users u ON d.user_id = u.id
        LEFT JOIN doctor_profiles dp ON d.id = dp.doctor_id
        LEFT JOIN specialties s ON dp.primary_specialty_id = s.id
        WHERE d.id = @doctorId
      `);

        return result.recordset[0] || null;
    }

    async findVisibleDoctors(specialtyId = null) {
        const pool = await getPool();
        let query = `
      SELECT 
        d.id,
        d.display_name,
        u.full_name,
        u.phone,
        u.email,
        dp.title_prefix,
        dp.description_short,
        dp.photo_url,
        dp.photo_svg,
        dp.has_image,
        dp.sort_order,
        s.name as primary_specialty_name
      FROM doctors d
      INNER JOIN users u ON d.user_id = u.id
      LEFT JOIN doctor_profiles dp ON d.id = dp.doctor_id
      LEFT JOIN specialties s ON dp.primary_specialty_id = s.id
      WHERE (dp.is_visible = 1 OR dp.is_visible IS NULL)
    `;

        const request = pool.request();

        if (specialtyId) {
            query += `
        AND EXISTS (
          SELECT 1 FROM doctor_specialty ds 
          WHERE ds.doctor_id = d.id AND ds.specialty_id = @specialtyId
        )
      `;
            request.input('specialtyId', sql.Int, specialtyId);
        }

        query += ' ORDER BY dp.sort_order ASC, d.display_name';

        const result = await request.query(query);
        return result.recordset;
    }

    async getSpecialties(doctorId) {
        const pool = await getPool();
        const result = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .query(`
        SELECT 
          s.id,
          s.name,
          s.booking_mode
        FROM specialties s
        INNER JOIN doctor_specialty ds ON s.id = ds.specialty_id
        WHERE ds.doctor_id = @doctorId
        ORDER BY s.name
      `);

        return result.recordset;
    }

    async addSpecialty(doctorId, specialtyId) {
        const pool = await getPool();
        try {
            const result = await pool.request()
                .input('doctorId', sql.Int, doctorId)
                .input('specialtyId', sql.Int, specialtyId)
                .query(`
          INSERT INTO doctor_specialty (doctor_id, specialty_id)
          VALUES (@doctorId, @specialtyId)
        `);

            return result.rowsAffected[0] > 0;
        } catch (error) {
            if (error.number === 2627) { // Duplicate key error
                return false;
            }
            throw error;
        }
    }

    async removeSpecialty(doctorId, specialtyId) {
        const pool = await getPool();
        const result = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .input('specialtyId', sql.Int, specialtyId)
            .query(`
        DELETE FROM doctor_specialty 
        WHERE doctor_id = @doctorId AND specialty_id = @specialtyId
      `);

        return result.rowsAffected[0] > 0;
    }

    async updateProfile(doctorId, profileData) {
        const pool = await getPool();
        const {
            primary_specialty_id,
            title_prefix,
            description_short,
            description_long,
            photo_url,
            photo_svg,
            is_visible,
            sort_order
        } = profileData;

        // Verificar si el perfil existe
        const existingProfile = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .query('SELECT doctor_id FROM doctor_profiles WHERE doctor_id = @doctorId');

        if (existingProfile.recordset.length === 0) {
            // Crear nuevo perfil
            const result = await pool.request()
                .input('doctorId', sql.Int, doctorId)
                .input('primary_specialty_id', sql.Int, primary_specialty_id || null)
                .input('title_prefix', sql.NVarChar, title_prefix || null)
                .input('description_short', sql.NVarChar, description_short || null)
                .input('description_long', sql.NVarChar, description_long || null)
                .input('photo_url', sql.NVarChar, photo_url || null)
                .input('photo_svg', sql.NVarChar, photo_svg || null)
                .input('is_visible', sql.Bit, is_visible !== undefined ? is_visible : true)
                .input('sort_order', sql.Int, sort_order || 0)
                .query(`
          INSERT INTO doctor_profiles 
          (doctor_id, primary_specialty_id, title_prefix, description_short, description_long, photo_url, photo_svg, is_visible, sort_order)
          VALUES 
          (@doctorId, @primary_specialty_id, @title_prefix, @description_short, @description_long, @photo_url, @photo_svg, @is_visible, @sort_order)
        `);

            return result.rowsAffected[0] > 0;
        } else {
            // Actualizar perfil existente
            const result = await pool.request()
                .input('doctorId', sql.Int, doctorId)
                .input('primary_specialty_id', sql.Int, primary_specialty_id || null)
                .input('title_prefix', sql.NVarChar, title_prefix || null)
                .input('description_short', sql.NVarChar, description_short || null)
                .input('description_long', sql.NVarChar, description_long || null)
                .input('photo_url', sql.NVarChar, photo_url || null)
                .input('photo_svg', sql.NVarChar, photo_svg || null)
                .input('is_visible', sql.Bit, is_visible !== undefined ? is_visible : true)
                .input('sort_order', sql.Int, sort_order || 0)
                .query(`
          UPDATE doctor_profiles SET
            primary_specialty_id = @primary_specialty_id,
            title_prefix = @title_prefix,
            description_short = @description_short,
            description_long = @description_long,
            photo_url = @photo_url,
            photo_svg = @photo_svg,
            is_visible = @is_visible,
            sort_order = @sort_order
          WHERE doctor_id = @doctorId
        `);

            return result.rowsAffected[0] > 0;
        }
    }
}

module.exports = new Doctor();
