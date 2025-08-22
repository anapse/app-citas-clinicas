const { getPool, sql } = require('../db/connection');

class AvailabilityService {

    /**
     * Obtiene los slots disponibles para una especialidad en una fecha específica
     * @param {number} specialtyId - ID de la especialidad
     * @param {number|null} doctorId - ID del doctor (opcional)
     * @param {string} date - Fecha en formato YYYY-MM-DD
     * @returns {Array} Array de slots disponibles
     */
    async getAvailableSlots(specialtyId, doctorId = null, date) {
        // Validar que la especialidad permita reservas por slots
        const specialty = await this.getSpecialty(specialtyId);
        if (specialty.booking_mode === 'WALKIN') {
            throw new Error('Esta especialidad no maneja reservas por horarios. Atiende por orden de llegada.');
        }

        if (specialty.booking_mode === 'REQUEST') {
            throw new Error('Esta especialidad requiere solicitud previa. No se pueden reservar horarios directamente.');
        }

        const dayOfWeek = new Date(date + 'T00:00:00').getDay();
        const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // Domingo = 7, Lunes = 1

        // Obtener horarios activos para la fecha
        const schedules = await this.getActiveSchedules(specialtyId, doctorId, date, adjustedDayOfWeek);

        if (schedules.length === 0) {
            return [];
        }

        // Obtener citas existentes para evitar solapamientos
        const existingAppointments = await this.getExistingAppointments(specialtyId, doctorId, date);

        // Generar slots para cada horario
        const allSlots = [];
        for (const schedule of schedules) {
            const slots = this.generateTimeSlots(schedule, date, existingAppointments);
            allSlots.push(...slots);
        }

        return allSlots.sort((a, b) => new Date(a.start) - new Date(b.start));
    }

    /**
     * Obtiene información de la especialidad
     */
    async getSpecialty(specialtyId) {
        const pool = await getPool();
        const result = await pool.request()
            .input('specialtyId', sql.Int, specialtyId)
            .query('SELECT * FROM specialties WHERE id = @specialtyId');

        if (result.recordset.length === 0) {
            throw new Error('Especialidad no encontrada');
        }

        return result.recordset[0];
    }

    /**
     * Obtiene los horarios activos para una fecha específica
     */
    async getActiveSchedules(specialtyId, doctorId, date, dayOfWeek) {
        const pool = await getPool();

        let query = `
      SELECT 
        s.*,
        se.is_closed,
        se.ex_time_start,
        se.ex_time_end
      FROM schedules s
      LEFT JOIN schedule_exceptions se ON s.id = se.schedule_id AND se.the_date = @date
      WHERE s.specialty_id = @specialtyId 
        AND s.active = 1
        AND (
          (s.type = 'WEEKLY' 
           AND (s.days_mask & POWER(2, @dayOfWeek - 1)) > 0
           AND s.date_start <= @date 
           AND (s.date_end IS NULL OR s.date_end >= @date))
          OR 
          (s.type = 'ONE_OFF' AND s.date_start = @date)
        )
        AND (se.is_closed IS NULL OR se.is_closed = 0)
    `;

        const request = pool.request()
            .input('specialtyId', sql.Int, specialtyId)
            .input('date', sql.Date, date)
            .input('dayOfWeek', sql.Int, dayOfWeek);

        if (doctorId) {
            query += ' AND (s.doctor_id = @doctorId OR s.doctor_id IS NULL)';
            request.input('doctorId', sql.Int, doctorId);
        }

        const result = await request.query(query);
        return result.recordset;
    }

    /**
     * Obtiene las citas existentes para una fecha
     */
    async getExistingAppointments(specialtyId, doctorId, date) {
        const pool = await getPool();

        let query = `
      SELECT start_dt, end_dt, doctor_id
      FROM appointments 
      WHERE specialty_id = @specialtyId
        AND CAST(start_dt AS DATE) = @date
        AND status IN ('booked', 'confirmed', 'checked_in')
    `;

        const request = pool.request()
            .input('specialtyId', sql.Int, specialtyId)
            .input('date', sql.Date, date);

        if (doctorId) {
            query += ' AND doctor_id = @doctorId';
            request.input('doctorId', sql.Int, doctorId);
        }

        const result = await request.query(query);
        return result.recordset;
    }

    /**
     * Genera slots de tiempo basado en el horario
     */
    generateTimeSlots(schedule, date, existingAppointments) {
        const slots = [];

        // Determinar el horario efectivo (considerar excepciones)
        const startTime = schedule.ex_time_start || schedule.time_start;
        const endTime = schedule.ex_time_end || schedule.time_end;

        const slotMinutes = schedule.slot_minutes;
        const capacity = schedule.capacity;

        // Convertir times a minutos desde medianoche
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);

        for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += slotMinutes) {
            const slotStart = this.minutesToDateTime(date, currentMinutes);
            const slotEnd = this.minutesToDateTime(date, currentMinutes + slotMinutes);

            // Contar citas existentes en este slot
            const conflictingAppointments = existingAppointments.filter(apt => {
                const aptStart = new Date(apt.start_dt);
                const aptEnd = new Date(apt.end_dt);

                // Verificar solapamiento
                return (slotStart < aptEnd && slotEnd > aptStart) &&
                    (!schedule.doctor_id || apt.doctor_id === schedule.doctor_id);
            });

            const taken = conflictingAppointments.length;
            const available = Math.max(0, capacity - taken);

            slots.push({
                start: slotStart.toISOString(),
                end: slotEnd.toISOString(),
                capacity: capacity,
                taken: taken,
                available: available,
                doctorId: schedule.doctor_id,
                scheduleId: schedule.id
            });
        }

        return slots;
    }

    /**
     * Convierte time string a minutos desde medianoche
     */
    timeToMinutes(timeString) {
        // timeString puede ser un objeto Time de SQL Server o string "HH:MM"
        let timeStr;
        if (typeof timeString === 'string') {
            timeStr = timeString;
        } else {
            // Objeto Time de SQL Server
            timeStr = timeString.toString();
        }

        const [hours, minutes] = timeStr.split(':').map(num => parseInt(num));
        return hours * 60 + minutes;
    }

    /**
     * Convierte minutos desde medianoche a DateTime
     */
    minutesToDateTime(dateStr, totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return new Date(`${dateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
    }

    /**
     * Verifica si un slot específico está disponible
     */
    async isSlotAvailable(specialtyId, doctorId, startDateTime, endDateTime) {
        const date = startDateTime.toISOString().split('T')[0];
        const availableSlots = await this.getAvailableSlots(specialtyId, doctorId, date);

        const requestedStart = startDateTime.toISOString();
        const requestedEnd = endDateTime.toISOString();

        const matchingSlot = availableSlots.find(slot =>
            slot.start === requestedStart &&
            slot.end === requestedEnd &&
            slot.available > 0 &&
            (!doctorId || slot.doctorId === doctorId)
        );

        return !!matchingSlot;
    }

    /**
     * Obtiene horarios de clínica general
     */
    async getClinicHours() {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
        SELECT * FROM clinic_hours 
        WHERE active = 1 
        ORDER BY day_of_week, start_time
      `);

        return result.recordset;
    }

    /**
     * Formatea horarios de clínica para una especialidad WALKIN
     */
    async getWalkinSchedule(specialtyId) {
        const specialty = await this.getSpecialty(specialtyId);

        if (specialty.booking_mode !== 'WALKIN') {
            throw new Error('Esta especialidad no es de tipo WALKIN');
        }

        const clinicHours = await this.getClinicHours();

        const schedule = {
            specialty: specialty.name,
            mode: 'WALKIN',
            message: 'Atención por orden de llegada. No requiere cita previa.',
            hours: {}
        };

        // Agrupar por día de la semana
        const daysOfWeek = {
            1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves',
            5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
        };

        clinicHours.forEach(hour => {
            const dayName = daysOfWeek[hour.day_of_week];
            if (!schedule.hours[dayName]) {
                schedule.hours[dayName] = [];
            }

            schedule.hours[dayName].push({
                start: hour.start_time,
                end: hour.end_time
            });
        });

        return schedule;
    }
}

module.exports = new AvailabilityService();
