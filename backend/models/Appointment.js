const { getPool, sql } = require('../db/connection');
const BaseModel = require('./BaseModel');

class Appointment extends BaseModel {
    constructor() {
        super('appointments');
    }

    async findByDateRange(filters = {}) {
        const pool = await getPool();
        let query = `
      SELECT 
        a.*,
        s.name as specialty_name,
        s.booking_mode,
        d.display_name as doctor_name,
        u.full_name as created_by_name
      FROM appointments a
      INNER JOIN specialties s ON a.specialty_id = s.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE 1=1
    `;

        const request = pool.request();
        const conditions = [];

        if (filters.from) {
            conditions.push('a.start_dt >= @from');
            request.input('from', sql.DateTime2, filters.from);
        }

        if (filters.to) {
            conditions.push('a.start_dt <= @to');
            request.input('to', sql.DateTime2, filters.to);
        }

        if (filters.doctorId) {
            conditions.push('a.doctor_id = @doctorId');
            request.input('doctorId', sql.Int, filters.doctorId);
        }

        if (filters.specialtyId) {
            conditions.push('a.specialty_id = @specialtyId');
            request.input('specialtyId', sql.Int, filters.specialtyId);
        }

        if (filters.dni) {
            conditions.push('a.dni = @dni');
            request.input('dni', sql.NVarChar, filters.dni);
        }

        if (filters.status) {
            conditions.push('a.status = @status');
            request.input('status', sql.NVarChar, filters.status);
        }

        if (conditions.length > 0) {
            query += ' AND ' + conditions.join(' AND ');
        }

        query += ' ORDER BY a.start_dt ASC';

        const result = await request.query(query);
        return result.recordset;
    }

    async findByPatientDni(dni, activeOnly = true) {
        const pool = await getPool();
        let query = `
      SELECT 
        a.*,
        s.name as specialty_name,
        d.display_name as doctor_name
      FROM appointments a
      INNER JOIN specialties s ON a.specialty_id = s.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.dni = @dni
    `;

        if (activeOnly) {
            query += " AND a.status IN ('booked', 'confirmed', 'checked_in')";
        }

        query += ' ORDER BY a.start_dt DESC';

        const result = await pool.request()
            .input('dni', sql.NVarChar, dni)
            .query(query);

        return result.recordset;
    }

    async checkConflicts(data) {
        const pool = await getPool();
        const { dni, doctorId, start_dt, end_dt, excludeId } = data;

        // Verificar si el paciente ya tiene una cita ese día
        let patientQuery = `
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE dni = @dni 
        AND CAST(start_dt AS DATE) = CAST(@start_dt AS DATE)
        AND status IN ('booked', 'confirmed', 'checked_in')
    `;

        const request = pool.request()
            .input('dni', sql.NVarChar, dni)
            .input('start_dt', sql.DateTime2, start_dt);

        if (excludeId) {
            patientQuery += ' AND id != @excludeId';
            request.input('excludeId', sql.Int, excludeId);
        }

        const patientResult = await request.query(patientQuery);

        if (patientResult.recordset[0].count > 0) {
            return { hasConflict: true, type: 'patient', message: 'Ya tienes una cita ese día.' };
        }

        // Verificar solapamiento de horarios con el doctor
        if (doctorId) {
            let doctorQuery = `
        SELECT COUNT(*) as count 
        FROM appointments 
        WHERE doctor_id = @doctorId
          AND status IN ('booked', 'confirmed', 'checked_in')
          AND (
            (@start_dt < end_dt AND @end_dt > start_dt)
          )
      `;

            const doctorRequest = pool.request()
                .input('doctorId', sql.Int, doctorId)
                .input('start_dt', sql.DateTime2, start_dt)
                .input('end_dt', sql.DateTime2, end_dt);

            if (excludeId) {
                doctorQuery += ' AND id != @excludeId';
                doctorRequest.input('excludeId', sql.Int, excludeId);
            }

            const doctorResult = await doctorRequest.query(doctorQuery);

            if (doctorResult.recordset[0].count > 0) {
                return { hasConflict: true, type: 'doctor', message: 'Ese horario ya fue tomado.' };
            }
        }

        return { hasConflict: false };
    }

    async createAppointment(data) {
        const pool = await getPool();
        const {
            specialty_id,
            doctor_id,
            patient_name,
            dni,
            birthdate,
            phone,
            start_dt,
            end_dt,
            created_by,
            status = 'booked'
        } = data;

        try {
            const result = await pool.request()
                .input('specialty_id', sql.Int, specialty_id)
                .input('doctor_id', sql.Int, doctor_id || null)
                .input('patient_name', sql.NVarChar, patient_name)
                .input('dni', sql.NVarChar, dni)
                .input('birthdate', sql.Date, birthdate)
                .input('phone', sql.NVarChar, phone || null)
                .input('start_dt', sql.DateTime2, start_dt)
                .input('end_dt', sql.DateTime2, end_dt)
                .input('created_by', sql.Int, created_by || null)
                .input('status', sql.NVarChar, status)
                .query(`
          INSERT INTO appointments 
          (specialty_id, doctor_id, patient_name, dni, birthdate, phone, start_dt, end_dt, created_by, status)
          OUTPUT INSERTED.*
          VALUES 
          (@specialty_id, @doctor_id, @patient_name, @dni, @birthdate, @phone, @start_dt, @end_dt, @created_by, @status)
        `);

            return result.recordset[0];
        } catch (error) {
            // Mapear errores de SQL Server a mensajes amigables
            if (error.number === 2627 || error.number === 2601) {
                if (error.message.includes('UQ_Patient_Per_Day')) {
                    throw new Error('Ya tienes una cita ese día.');
                } else if (error.message.includes('UQ_Doctor_Slot')) {
                    throw new Error('Ese horario ya fue tomado.');
                }
            }
            throw error;
        }
    }

    async updateStatus(id, status, userId = null) {
        const pool = await getPool();
        let query = 'UPDATE appointments SET status = @status';

        if (status === 'cancelled') {
            query += ', cancelled_at = SYSDATETIME()';
        }

        query += ' WHERE id = @id';

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('status', sql.NVarChar, status)
            .query(query);

        return result.rowsAffected[0] > 0;
    }

    async findByDoctorAndDate(doctorId, date) {
        const pool = await getPool();
        const result = await pool.request()
            .input('doctorId', sql.Int, doctorId)
            .input('date', sql.Date, date)
            .query(`
        SELECT 
          a.*,
          s.name as specialty_name
        FROM appointments a
        INNER JOIN specialties s ON a.specialty_id = s.id
        WHERE a.doctor_id = @doctorId
          AND CAST(a.start_dt AS DATE) = @date
          AND a.status IN ('booked', 'confirmed', 'checked_in')
        ORDER BY a.start_dt
      `);

        return result.recordset;
    }

    async getPatientHistory(dni, limit = 10) {
        const pool = await getPool();
        const result = await pool.request()
            .input('dni', sql.NVarChar, dni)
            .input('limit', sql.Int, limit)
            .query(`
        SELECT TOP (@limit)
          a.*,
          s.name as specialty_name,
          d.display_name as doctor_name
        FROM appointments a
        INNER JOIN specialties s ON a.specialty_id = s.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        WHERE a.dni = @dni
        ORDER BY a.start_dt DESC
      `);

        return result.recordset;
    }
}

module.exports = new Appointment();
