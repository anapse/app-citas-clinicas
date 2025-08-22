const AvailabilityService = require('../services/availabilityService');
const Specialty = require('../models/Specialty');

class AvailabilityController {

    async getAvailability(req, res, next) {
        try {
            const { specialtyId, doctorId, date } = req.query;

            // Validar parámetros requeridos
            if (!specialtyId) {
                return res.status(400).json({
                    error: 'ID de especialidad requerido',
                    code: 'SPECIALTY_ID_REQUIRED'
                });
            }

            if (!date) {
                return res.status(400).json({
                    error: 'Fecha requerida (formato YYYY-MM-DD)',
                    code: 'DATE_REQUIRED'
                });
            }

            // Validar formato de fecha
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                return res.status(400).json({
                    error: 'Formato de fecha inválido. Use YYYY-MM-DD',
                    code: 'INVALID_DATE_FORMAT'
                });
            }

            // Validar que la fecha sea válida
            const requestedDate = new Date(date + 'T00:00:00');
            if (isNaN(requestedDate)) {
                return res.status(400).json({
                    error: 'Fecha inválida',
                    code: 'INVALID_DATE'
                });
            }

            // Validar que la fecha sea futura o presente
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (requestedDate < today) {
                return res.status(400).json({
                    error: 'No se puede consultar disponibilidad de fechas pasadas',
                    code: 'PAST_DATE_NOT_ALLOWED'
                });
            }

            const parsedSpecialtyId = parseInt(specialtyId);
            const parsedDoctorId = doctorId ? parseInt(doctorId) : null;

            // Verificar que la especialidad existe
            const specialty = await Specialty.findById(parsedSpecialtyId);
            if (!specialty) {
                return res.status(404).json({
                    error: 'Especialidad no encontrada',
                    code: 'SPECIALTY_NOT_FOUND'
                });
            }

            // Manejar especialidades WALKIN
            if (specialty.booking_mode === 'WALKIN') {
                const walkinSchedule = await AvailabilityService.getWalkinSchedule(parsedSpecialtyId);

                return res.json({
                    specialty: {
                        id: specialty.id,
                        name: specialty.name,
                        booking_mode: specialty.booking_mode
                    },
                    date,
                    schedule: walkinSchedule,
                    message: 'Esta especialidad atiende por orden de llegada. No requiere reserva de horario.'
                });
            }

            // Manejar especialidades REQUEST
            if (specialty.booking_mode === 'REQUEST') {
                return res.json({
                    specialty: {
                        id: specialty.id,
                        name: specialty.name,
                        booking_mode: specialty.booking_mode
                    },
                    date,
                    available_slots: [],
                    message: 'Esta especialidad requiere solicitud previa. Use el endpoint de requests para solicitar una cita.'
                });
            }

            // Obtener slots disponibles para especialidades SLOT
            const availableSlots = await AvailabilityService.getAvailableSlots(
                parsedSpecialtyId,
                parsedDoctorId,
                date
            );

            res.json({
                specialty: {
                    id: specialty.id,
                    name: specialty.name,
                    booking_mode: specialty.booking_mode
                },
                date,
                doctor_id: parsedDoctorId,
                available_slots: availableSlots,
                total_slots: availableSlots.length,
                available_count: availableSlots.reduce((sum, slot) => sum + slot.available, 0)
            });

        } catch (error) {
            // Manejar errores específicos del servicio
            if (error.message.includes('no maneja reservas por horarios') ||
                error.message.includes('requiere solicitud previa')) {
                return res.status(409).json({
                    error: error.message,
                    code: 'INVALID_BOOKING_MODE'
                });
            }

            next(error);
        }
    }

    async getAvailabilityByDoctor(req, res, next) {
        try {
            const { doctorId } = req.params;
            const { date, specialtyId } = req.query;

            if (!date) {
                return res.status(400).json({
                    error: 'Fecha requerida (formato YYYY-MM-DD)',
                    code: 'DATE_REQUIRED'
                });
            }

            const parsedDoctorId = parseInt(doctorId);
            const parsedSpecialtyId = specialtyId ? parseInt(specialtyId) : null;

            // Verificar que el doctor existe
            const Doctor = require('../models/Doctor');
            const doctor = await Doctor.findById(parsedDoctorId);
            if (!doctor) {
                return res.status(404).json({
                    error: 'Doctor no encontrado',
                    code: 'DOCTOR_NOT_FOUND'
                });
            }

            // Si se especifica especialidad, obtener para esa especialidad
            if (parsedSpecialtyId) {
                const availableSlots = await AvailabilityService.getAvailableSlots(
                    parsedSpecialtyId,
                    parsedDoctorId,
                    date
                );

                return res.json({
                    doctor: {
                        id: doctor.id,
                        name: doctor.display_name
                    },
                    specialty_id: parsedSpecialtyId,
                    date,
                    available_slots: availableSlots
                });
            }

            // Si no se especifica especialidad, obtener para todas las especialidades del doctor
            const specialties = await Doctor.getSpecialties(parsedDoctorId);
            const allSlots = {};

            for (const specialty of specialties) {
                if (specialty.booking_mode === 'SLOT') {
                    try {
                        const slots = await AvailabilityService.getAvailableSlots(
                            specialty.id,
                            parsedDoctorId,
                            date
                        );
                        allSlots[specialty.id] = {
                            specialty_name: specialty.name,
                            slots
                        };
                    } catch (error) {
                        // Si hay error para una especialidad, continuar con las demás
                        allSlots[specialty.id] = {
                            specialty_name: specialty.name,
                            slots: [],
                            error: error.message
                        };
                    }
                }
            }

            res.json({
                doctor: {
                    id: doctor.id,
                    name: doctor.display_name
                },
                date,
                specialties: allSlots
            });

        } catch (error) {
            next(error);
        }
    }

    async getWeeklyAvailability(req, res, next) {
        try {
            const { specialtyId, doctorId } = req.query;

            if (!specialtyId) {
                return res.status(400).json({
                    error: 'ID de especialidad requerido',
                    code: 'SPECIALTY_ID_REQUIRED'
                });
            }

            const parsedSpecialtyId = parseInt(specialtyId);
            const parsedDoctorId = doctorId ? parseInt(doctorId) : null;

            // Verificar especialidad
            const specialty = await Specialty.findById(parsedSpecialtyId);
            if (!specialty) {
                return res.status(404).json({
                    error: 'Especialidad no encontrada',
                    code: 'SPECIALTY_NOT_FOUND'
                });
            }

            if (specialty.booking_mode !== 'SLOT') {
                return res.status(400).json({
                    error: 'Solo las especialidades con modo SLOT soportan consulta semanal',
                    code: 'INVALID_BOOKING_MODE'
                });
            }

            // Generar fechas para los próximos 7 días
            const weeklySlots = {};
            const today = new Date();

            for (let i = 0; i < 7; i++) {
                const currentDate = new Date(today);
                currentDate.setDate(today.getDate() + i);
                const dateStr = currentDate.toISOString().split('T')[0];

                try {
                    const slots = await AvailabilityService.getAvailableSlots(
                        parsedSpecialtyId,
                        parsedDoctorId,
                        dateStr
                    );

                    weeklySlots[dateStr] = {
                        day_name: currentDate.toLocaleDateString('es-ES', { weekday: 'long' }),
                        slots,
                        total_available: slots.reduce((sum, slot) => sum + slot.available, 0)
                    };
                } catch (error) {
                    weeklySlots[dateStr] = {
                        day_name: currentDate.toLocaleDateString('es-ES', { weekday: 'long' }),
                        slots: [],
                        total_available: 0,
                        error: error.message
                    };
                }
            }

            res.json({
                specialty: {
                    id: specialty.id,
                    name: specialty.name,
                    booking_mode: specialty.booking_mode
                },
                doctor_id: parsedDoctorId,
                weekly_availability: weeklySlots
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AvailabilityController();
