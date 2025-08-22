const { getPool, sql } = require('../db/connection');
const BaseModel = require('./BaseModel');

class Specialty extends BaseModel {
    constructor() {
        super('specialties');
    }

    async findByBookingMode(bookingMode) {
        const pool = await getPool();
        const result = await pool.request()
            .input('bookingMode', sql.NVarChar, bookingMode)
            .query('SELECT * FROM specialties WHERE booking_mode = @bookingMode ORDER BY name');

        return result.recordset;
    }

    async findWithDoctors() {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
        SELECT 
          s.*,
          COUNT(ds.doctor_id) as doctor_count
        FROM specialties s
        LEFT JOIN doctor_specialty ds ON s.id = ds.specialty_id
        LEFT JOIN doctors d ON ds.doctor_id = d.id
        LEFT JOIN doctor_profiles dp ON d.id = dp.doctor_id
        WHERE dp.is_visible = 1 OR dp.is_visible IS NULL
        GROUP BY s.id, s.name, s.booking_mode, s.created_at
        ORDER BY s.name
      `);

        return result.recordset;
    }

    async getDoctorsBySpecialty(specialtyId) {
        const pool = await getPool();
        const result = await pool.request()
            .input('specialtyId', sql.Int, specialtyId)
            .query(`
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
          dp.sort_order
        FROM doctors d
        INNER JOIN doctor_specialty ds ON d.id = ds.doctor_id
        INNER JOIN users u ON d.user_id = u.id
        LEFT JOIN doctor_profiles dp ON d.id = dp.doctor_id
        WHERE ds.specialty_id = @specialtyId 
          AND (dp.is_visible = 1 OR dp.is_visible IS NULL)
        ORDER BY dp.sort_order ASC, d.display_name
      `);

        return result.recordset;
    }
}

module.exports = new Specialty();
