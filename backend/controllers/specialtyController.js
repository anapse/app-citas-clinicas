const Specialty = require('../models/Specialty');
const SecurityService = require('../services/securityService');

class SpecialtyController {

    async getSpecialties(req, res, next) {
        try {
            const { booking_mode, with_doctors } = req.query;

            let specialties;

            if (booking_mode) {
                const validModes = ['SLOT', 'REQUEST', 'WALKIN'];
                if (!validModes.includes(booking_mode)) {
                    return res.status(400).json({
                        error: 'Modo de reserva inválido',
                        code: 'INVALID_BOOKING_MODE',
                        details: `Modos válidos: ${validModes.join(', ')}`
                    });
                }
                specialties = await Specialty.findByBookingMode(booking_mode);
            } else if (with_doctors === 'true') {
                specialties = await Specialty.findWithDoctors();
            } else {
                specialties = await Specialty.findAll({}, 'name');
            }

            res.json({
                specialties: specialties.map(spec => ({
                    id: spec.id,
                    name: spec.name,
                    booking_mode: spec.booking_mode,
                    doctor_count: spec.doctor_count || 0,
                    created_at: spec.created_at
                }))
            });

        } catch (error) {
            next(error);
        }
    }

    async getSpecialtyById(req, res, next) {
        try {
            const specialtyId = parseInt(req.params.id);

            const specialty = await Specialty.findById(specialtyId);
            if (!specialty) {
                return res.status(404).json({
                    error: 'Especialidad no encontrada',
                    code: 'SPECIALTY_NOT_FOUND'
                });
            }

            // Obtener doctores de la especialidad
            const doctors = await Specialty.getDoctorsBySpecialty(specialtyId);

            res.json({
                specialty: {
                    id: specialty.id,
                    name: specialty.name,
                    booking_mode: specialty.booking_mode,
                    created_at: specialty.created_at
                },
                doctors: doctors.map(doc => ({
                    id: doc.id,
                    display_name: doc.display_name,
                    full_name: doc.full_name,
                    title_prefix: doc.title_prefix,
                    description_short: doc.description_short,
                    photo_url: doc.photo_url,
                    photo_svg: doc.photo_svg,
                    has_image: doc.has_image,
                    sort_order: doc.sort_order
                }))
            });

        } catch (error) {
            next(error);
        }
    }

    async createSpecialty(req, res, next) {
        try {
            const { name, booking_mode } = req.body;

            // Validar modo de reserva
            const validModes = ['SLOT', 'REQUEST', 'WALKIN'];
            if (!validModes.includes(booking_mode)) {
                return res.status(400).json({
                    error: 'Modo de reserva inválido',
                    code: 'INVALID_BOOKING_MODE',
                    details: `Modos válidos: ${validModes.join(', ')}`
                });
            }

            // Verificar que no exista una especialidad con el mismo nombre
            const existing = await Specialty.findAll({ name: SecurityService.sanitizeText(name) });
            if (existing.length > 0) {
                return res.status(409).json({
                    error: 'Ya existe una especialidad con ese nombre',
                    code: 'SPECIALTY_NAME_EXISTS'
                });
            }

            const specialtyData = {
                name: SecurityService.sanitizeText(name),
                booking_mode
            };

            const newSpecialtyId = await Specialty.create(specialtyData);
            const newSpecialty = await Specialty.findById(newSpecialtyId);

            res.status(201).json({
                message: 'Especialidad creada exitosamente',
                specialty: {
                    id: newSpecialty.id,
                    name: newSpecialty.name,
                    booking_mode: newSpecialty.booking_mode,
                    created_at: newSpecialty.created_at
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async updateSpecialty(req, res, next) {
        try {
            const specialtyId = parseInt(req.params.id);
            const { name, booking_mode } = req.body;

            // Verificar que la especialidad existe
            const specialty = await Specialty.findById(specialtyId);
            if (!specialty) {
                return res.status(404).json({
                    error: 'Especialidad no encontrada',
                    code: 'SPECIALTY_NOT_FOUND'
                });
            }

            const updates = {};

            if (name !== undefined) {
                // Verificar que no exista otra especialidad con el mismo nombre
                const existing = await Specialty.findAll({ name: SecurityService.sanitizeText(name) });
                const duplicates = existing.filter(spec => spec.id !== specialtyId);

                if (duplicates.length > 0) {
                    return res.status(409).json({
                        error: 'Ya existe otra especialidad con ese nombre',
                        code: 'SPECIALTY_NAME_EXISTS'
                    });
                }

                updates.name = SecurityService.sanitizeText(name);
            }

            if (booking_mode !== undefined) {
                const validModes = ['SLOT', 'REQUEST', 'WALKIN'];
                if (!validModes.includes(booking_mode)) {
                    return res.status(400).json({
                        error: 'Modo de reserva inválido',
                        code: 'INVALID_BOOKING_MODE',
                        details: `Modos válidos: ${validModes.join(', ')}`
                    });
                }
                updates.booking_mode = booking_mode;
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({
                    error: 'No hay datos para actualizar',
                    code: 'NO_UPDATE_DATA'
                });
            }

            const rowsAffected = await Specialty.update(specialtyId, updates);

            if (rowsAffected === 0) {
                return res.status(500).json({
                    error: 'Error al actualizar la especialidad',
                    code: 'UPDATE_FAILED'
                });
            }

            // Obtener especialidad actualizada
            const updatedSpecialty = await Specialty.findById(specialtyId);

            res.json({
                message: 'Especialidad actualizada exitosamente',
                specialty: {
                    id: updatedSpecialty.id,
                    name: updatedSpecialty.name,
                    booking_mode: updatedSpecialty.booking_mode,
                    created_at: updatedSpecialty.created_at
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async deleteSpecialty(req, res, next) {
        try {
            const specialtyId = parseInt(req.params.id);

            // Verificar que la especialidad existe
            const specialty = await Specialty.findById(specialtyId);
            if (!specialty) {
                return res.status(404).json({
                    error: 'Especialidad no encontrada',
                    code: 'SPECIALTY_NOT_FOUND'
                });
            }

            // Verificar que no tenga citas asociadas
            const { getPool, sql } = require('../db/connection');
            const pool = await getPool();

            const appointmentCheck = await pool.request()
                .input('specialtyId', sql.Int, specialtyId)
                .query('SELECT COUNT(*) as count FROM appointments WHERE specialty_id = @specialtyId');

            if (appointmentCheck.recordset[0].count > 0) {
                return res.status(409).json({
                    error: 'No se puede eliminar la especialidad porque tiene citas asociadas',
                    code: 'SPECIALTY_HAS_APPOINTMENTS'
                });
            }

            // Verificar que no tenga doctores asociados
            const doctorCheck = await pool.request()
                .input('specialtyId', sql.Int, specialtyId)
                .query('SELECT COUNT(*) as count FROM doctor_specialty WHERE specialty_id = @specialtyId');

            if (doctorCheck.recordset[0].count > 0) {
                return res.status(409).json({
                    error: 'No se puede eliminar la especialidad porque tiene doctores asociados',
                    code: 'SPECIALTY_HAS_DOCTORS'
                });
            }

            const rowsAffected = await Specialty.delete(specialtyId);

            if (rowsAffected === 0) {
                return res.status(500).json({
                    error: 'Error al eliminar la especialidad',
                    code: 'DELETE_FAILED'
                });
            }

            res.json({
                message: 'Especialidad eliminada exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    async getSpecialtyStats(req, res, next) {
        try {
            const specialtyId = parseInt(req.params.id);

            const specialty = await Specialty.findById(specialtyId);
            if (!specialty) {
                return res.status(404).json({
                    error: 'Especialidad no encontrada',
                    code: 'SPECIALTY_NOT_FOUND'
                });
            }

            const { getPool, sql } = require('../db/connection');
            const pool = await getPool();

            // Estadísticas de citas
            const appointmentStats = await pool.request()
                .input('specialtyId', sql.Int, specialtyId)
                .query(`
          SELECT 
            status,
            COUNT(*) as count
          FROM appointments 
          WHERE specialty_id = @specialtyId
          GROUP BY status
        `);

            // Estadísticas por mes (últimos 6 meses)
            const monthlyStats = await pool.request()
                .input('specialtyId', sql.Int, specialtyId)
                .query(`
          SELECT 
            YEAR(start_dt) as year,
            MONTH(start_dt) as month,
            COUNT(*) as count
          FROM appointments 
          WHERE specialty_id = @specialtyId
            AND start_dt >= DATEADD(month, -6, GETDATE())
          GROUP BY YEAR(start_dt), MONTH(start_dt)
          ORDER BY year, month
        `);

            // Contar doctores
            const doctorCount = await pool.request()
                .input('specialtyId', sql.Int, specialtyId)
                .query(`
          SELECT COUNT(*) as count 
          FROM doctor_specialty ds
          INNER JOIN doctor_profiles dp ON ds.doctor_id = dp.doctor_id
          WHERE ds.specialty_id = @specialtyId AND dp.is_visible = 1
        `);

            res.json({
                specialty: {
                    id: specialty.id,
                    name: specialty.name,
                    booking_mode: specialty.booking_mode
                },
                stats: {
                    doctors: doctorCount.recordset[0].count,
                    appointments_by_status: appointmentStats.recordset,
                    monthly_appointments: monthlyStats.recordset
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SpecialtyController();
