const Appointment = require('../models/Appointment');
const Specialty = require('../models/Specialty');
const Doctor = require('../models/Doctor');
const AvailabilityService = require('../services/availabilityService');
const SecurityService = require('../services/securityService');

class AppointmentController {

    async getAppointments(req, res, next) {
        try {
            const filters = SecurityService.sanitizeSearchParams(req.query);

            // Validar y convertir fechas
            if (filters.from) {
                filters.from = new Date(filters.from);
                if (isNaN(filters.from)) {
                    return res.status(400).json({
                        error: 'Fecha "from" inválida',
                        code: 'INVALID_FROM_DATE'
                    });
                }
            }

            if (filters.to) {
                filters.to = new Date(filters.to);
                if (isNaN(filters.to)) {
                    return res.status(400).json({
                        error: 'Fecha "to" inválida',
                        code: 'INVALID_TO_DATE'
                    });
                }
            }

            // Convertir IDs a números
            if (filters.doctorId) filters.doctorId = parseInt(filters.doctorId);
            if (filters.specialtyId) filters.specialtyId = parseInt(filters.specialtyId);

            // Restricciones por rol
            if (req.user.role === 'doctor') {
                const doctor = await Doctor.findByUserId(req.user.id);
                if (doctor) {
                    filters.doctorId = doctor.id; // Solo sus citas
                }
            } else if (req.user.role === 'paciente') {
                // Los pacientes solo ven sus propias citas
                if (!filters.dni) {
                    // Si no se especifica DNI, buscar por el DNI del usuario autenticado
                    const user = await User.findById(req.user.id);
                    if (user && user.dni) {
                        filters.dni = user.dni;
                    } else {
                        return res.status(400).json({
                            error: 'DNI requerido para consultar citas',
                            code: 'DNI_REQUIRED'
                        });
                    }
                }
            }

            const appointments = await Appointment.findByDateRange(filters);

            res.json({
                appointments: appointments.map(apt => ({
                    id: apt.id,
                    specialty: {
                        id: apt.specialty_id,
                        name: apt.specialty_name,
                        booking_mode: apt.booking_mode
                    },
                    doctor: apt.doctor_id ? {
                        id: apt.doctor_id,
                        name: apt.doctor_name
                    } : null,
                    patient: {
                        name: apt.patient_name,
                        dni: apt.dni,
                        birthdate: apt.birthdate,
                        phone: apt.phone
                    },
                    datetime: {
                        start: apt.start_dt,
                        end: apt.end_dt,
                        date: apt.appointment_date
                    },
                    status: apt.status,
                    created_by: apt.created_by_name,
                    created_at: apt.created_at,
                    cancelled_at: apt.cancelled_at
                }))
            });

        } catch (error) {
            next(error);
        }
    }

    async createAppointment(req, res, next) {
        try {
            const {
                specialty_id,
                doctor_id,
                patient,
                start,
                end
            } = req.body;

            // Validar datos del paciente
            if (!patient || !patient.name || !patient.dni || !patient.birthdate) {
                return res.status(400).json({
                    error: 'Datos del paciente incompletos',
                    code: 'INCOMPLETE_PATIENT_DATA',
                    details: 'Se requiere: name, dni, birthdate'
                });
            }

            // Validar fechas
            const startDateTime = new Date(start);
            const endDateTime = new Date(end);

            if (isNaN(startDateTime) || isNaN(endDateTime)) {
                return res.status(400).json({
                    error: 'Fechas inválidas',
                    code: 'INVALID_DATES'
                });
            }

            if (startDateTime >= endDateTime) {
                return res.status(400).json({
                    error: 'La fecha de inicio debe ser anterior a la fecha de fin',
                    code: 'INVALID_DATE_RANGE'
                });
            }

            if (!SecurityService.isFutureDateTime(startDateTime)) {
                return res.status(400).json({
                    error: 'La cita debe ser en el futuro',
                    code: 'PAST_DATE_NOT_ALLOWED'
                });
            }

            // Verificar que la especialidad existe
            const specialty = await Specialty.findById(specialty_id);
            if (!specialty) {
                return res.status(404).json({
                    error: 'Especialidad no encontrada',
                    code: 'SPECIALTY_NOT_FOUND'
                });
            }

            // Verificar modo de reserva
            if (specialty.booking_mode === 'WALKIN') {
                return res.status(409).json({
                    error: 'Esta especialidad no maneja reservas por horarios. Atiende por orden de llegada.',
                    code: 'WALKIN_SPECIALTY'
                });
            }

            if (specialty.booking_mode === 'REQUEST') {
                return res.status(409).json({
                    error: 'Esta especialidad requiere solicitud previa. Use el endpoint de requests.',
                    code: 'REQUEST_SPECIALTY'
                });
            }

            // Verificar disponibilidad del slot
            const isAvailable = await AvailabilityService.isSlotAvailable(
                specialty_id,
                doctor_id,
                startDateTime,
                endDateTime
            );

            if (!isAvailable) {
                return res.status(409).json({
                    error: 'El horario seleccionado no está disponible',
                    code: 'SLOT_NOT_AVAILABLE'
                });
            }

            // Verificar conflictos
            const conflicts = await Appointment.checkConflicts({
                dni: patient.dni,
                doctorId: doctor_id,
                start_dt: startDateTime,
                end_dt: endDateTime
            });

            if (conflicts.hasConflict) {
                return res.status(409).json({
                    error: conflicts.message,
                    code: 'APPOINTMENT_CONFLICT',
                    details: { type: conflicts.type }
                });
            }

            // Crear la cita
            const appointmentData = {
                specialty_id,
                doctor_id: doctor_id || null,
                patient_name: SecurityService.sanitizeText(patient.name),
                dni: SecurityService.sanitizeText(patient.dni),
                birthdate: new Date(patient.birthdate),
                phone: patient.phone ? SecurityService.sanitizeText(patient.phone) : null,
                start_dt: startDateTime,
                end_dt: endDateTime,
                created_by: req.user.id,
                status: 'booked'
            };

            const newAppointment = await Appointment.createAppointment(appointmentData);

            res.status(201).json({
                message: 'Cita creada exitosamente',
                appointment: {
                    id: newAppointment.id,
                    specialty: {
                        id: specialty_id,
                        name: specialty.name
                    },
                    doctor_id: newAppointment.doctor_id,
                    patient: {
                        name: newAppointment.patient_name,
                        dni: newAppointment.dni,
                        birthdate: newAppointment.birthdate,
                        phone: newAppointment.phone
                    },
                    datetime: {
                        start: newAppointment.start_dt,
                        end: newAppointment.end_dt
                    },
                    status: newAppointment.status,
                    created_at: newAppointment.created_at
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async getAppointmentById(req, res, next) {
        try {
            const appointmentId = parseInt(req.params.id);

            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                return res.status(404).json({
                    error: 'Cita no encontrada',
                    code: 'APPOINTMENT_NOT_FOUND'
                });
            }

            // Verificar permisos
            if (req.user.role === 'paciente') {
                const User = require('../models/User');
                const user = await User.findById(req.user.id);
                if (user.dni !== appointment.dni) {
                    return res.status(403).json({
                        error: 'No tienes permisos para ver esta cita',
                        code: 'ACCESS_DENIED'
                    });
                }
            } else if (req.user.role === 'doctor') {
                const doctor = await Doctor.findByUserId(req.user.id);
                if (doctor && appointment.doctor_id !== doctor.id) {
                    return res.status(403).json({
                        error: 'No tienes permisos para ver esta cita',
                        code: 'ACCESS_DENIED'
                    });
                }
            }

            res.json({
                appointment: {
                    id: appointment.id,
                    specialty_id: appointment.specialty_id,
                    doctor_id: appointment.doctor_id,
                    patient: {
                        name: appointment.patient_name,
                        dni: appointment.dni,
                        birthdate: appointment.birthdate,
                        phone: appointment.phone
                    },
                    datetime: {
                        start: appointment.start_dt,
                        end: appointment.end_dt
                    },
                    status: appointment.status,
                    created_by: appointment.created_by,
                    created_at: appointment.created_at,
                    cancelled_at: appointment.cancelled_at
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async cancelAppointment(req, res, next) {
        try {
            const appointmentId = parseInt(req.params.id);

            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                return res.status(404).json({
                    error: 'Cita no encontrada',
                    code: 'APPOINTMENT_NOT_FOUND'
                });
            }

            // Verificar que la cita se puede cancelar
            if (appointment.status === 'cancelled') {
                return res.status(400).json({
                    error: 'La cita ya está cancelada',
                    code: 'ALREADY_CANCELLED'
                });
            }

            // Verificar permisos para cancelar
            let canCancel = false;

            if (['admin', 'operador'].includes(req.user.role)) {
                canCancel = true;
            } else if (req.user.role === 'doctor') {
                const doctor = await Doctor.findByUserId(req.user.id);
                canCancel = doctor && appointment.doctor_id === doctor.id;
            } else if (req.user.role === 'paciente') {
                const User = require('../models/User');
                const user = await User.findById(req.user.id);
                canCancel = user.dni === appointment.dni;
            }

            if (!canCancel) {
                return res.status(403).json({
                    error: 'No tienes permisos para cancelar esta cita',
                    code: 'ACCESS_DENIED'
                });
            }

            // Verificar que no se cancele muy tarde (opcional)
            const appointmentStart = new Date(appointment.start_dt);
            const now = new Date();
            const hoursUntilAppointment = (appointmentStart - now) / (1000 * 60 * 60);

            if (hoursUntilAppointment < 2 && req.user.role === 'paciente') {
                return res.status(400).json({
                    error: 'No se puede cancelar una cita con menos de 2 horas de anticipación',
                    code: 'CANCELLATION_TOO_LATE'
                });
            }

            // Cancelar la cita
            const success = await Appointment.updateStatus(appointmentId, 'cancelled', req.user.id);

            if (!success) {
                return res.status(500).json({
                    error: 'Error al cancelar la cita',
                    code: 'CANCELLATION_FAILED'
                });
            }

            res.json({
                message: 'Cita cancelada exitosamente'
            });

        } catch (error) {
            next(error);
        }
    }

    async updateAppointmentStatus(req, res, next) {
        try {
            const appointmentId = parseInt(req.params.id);
            const { status } = req.body;

            const validStatuses = ['booked', 'confirmed', 'checked_in', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    error: 'Estado inválido',
                    code: 'INVALID_STATUS',
                    details: `Estados válidos: ${validStatuses.join(', ')}`
                });
            }

            const appointment = await Appointment.findById(appointmentId);
            if (!appointment) {
                return res.status(404).json({
                    error: 'Cita no encontrada',
                    code: 'APPOINTMENT_NOT_FOUND'
                });
            }

            const success = await Appointment.updateStatus(appointmentId, status, req.user.id);

            if (!success) {
                return res.status(500).json({
                    error: 'Error al actualizar el estado de la cita',
                    code: 'STATUS_UPDATE_FAILED'
                });
            }

            res.json({
                message: 'Estado de la cita actualizado exitosamente',
                status
            });

        } catch (error) {
            next(error);
        }
    }

    async getMyAppointments(req, res, next) {
        try {
            let appointments = [];

            if (req.user.role === 'paciente') {
                const User = require('../models/User');
                const user = await User.findById(req.user.id);
                if (user && user.dni) {
                    appointments = await Appointment.findByPatientDni(user.dni, false);
                }
            } else if (req.user.role === 'doctor') {
                const doctor = await Doctor.findByUserId(req.user.id);
                if (doctor) {
                    const filters = { doctorId: doctor.id };
                    appointments = await Appointment.findByDateRange(filters);
                }
            } else {
                return res.status(400).json({
                    error: 'Rol no válido para esta consulta',
                    code: 'INVALID_ROLE_FOR_QUERY'
                });
            }

            res.json({
                appointments: appointments.map(apt => ({
                    id: apt.id,
                    specialty: {
                        id: apt.specialty_id,
                        name: apt.specialty_name || 'Sin nombre'
                    },
                    doctor: apt.doctor_id ? {
                        id: apt.doctor_id,
                        name: apt.doctor_name || 'Sin nombre'
                    } : null,
                    patient: {
                        name: apt.patient_name,
                        dni: apt.dni,
                        birthdate: apt.birthdate,
                        phone: apt.phone
                    },
                    datetime: {
                        start: apt.start_dt,
                        end: apt.end_dt
                    },
                    status: apt.status,
                    created_at: apt.created_at,
                    cancelled_at: apt.cancelled_at
                }))
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AppointmentController();
