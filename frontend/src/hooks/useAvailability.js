import { useState, useCallback, useEffect } from 'react';
import { availabilityService } from '../services/availabilityService.js';
import { formatDateForAPI, isDateInRange, isSameDay } from '../utils/date.js';
import { useApi } from './useApi.js';

/**
 * Hook para manejar disponibilidad de doctores
 * @param {number} doctorId - ID del doctor
 * @param {string} specialtyId - ID de la especialidad
 * @returns {object}
 */
export const useAvailability = (doctorId = null, specialtyId = null) => {
    const [availability, setAvailability] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [availableDates, setAvailableDates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { execute } = useApi();

    /**
     * Obtener disponibilidad del doctor para un rango de fechas
     * @param {Date} startDate - Fecha de inicio
     * @param {Date} endDate - Fecha final
     * @param {number} doctorIdParam - ID del doctor (opcional)
     */
    const fetchAvailability = useCallback(async (startDate, endDate, doctorIdParam = null) => {
        if (!doctorIdParam && !doctorId) {
            console.warn('No doctor ID provided for availability fetch');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const result = await execute(() =>
                availabilityService.getAvailability(
                    doctorIdParam || doctorId,
                    formatDateForAPI(startDate),
                    formatDateForAPI(endDate)
                )
            );

            setAvailability(result);

            // Extraer fechas disponibles
            const dates = result.map(slot => slot.fecha).filter((date, index, self) =>
                self.indexOf(date) === index
            );
            setAvailableDates(dates);

            return result;
        } catch (error) {
            setError(error.message);
            console.error('Error fetching availability:', error);
        } finally {
            setLoading(false);
        }
    }, [doctorId, execute]);

    /**
     * Obtener slots disponibles para una fecha específica
     * @param {Date|string} date - Fecha
     * @returns {Array}
     */
    const getSlotsForDate = useCallback((date) => {
        if (!availability.length) return [];

        const dateStr = typeof date === 'string' ? date : formatDateForAPI(date);

        return availability.filter(slot =>
            slot.fecha === dateStr && slot.disponible
        ).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    }, [availability]);

    /**
     * Verificar si una fecha tiene slots disponibles
     * @param {Date|string} date - Fecha
     * @returns {boolean}
     */
    const isDateAvailable = useCallback((date) => {
        const slots = getSlotsForDate(date);
        return slots.length > 0;
    }, [getSlotsForDate]);

    /**
     * Seleccionar una fecha
     * @param {Date|string} date - Fecha
     */
    const selectDate = useCallback((date) => {
        setSelectedDate(date);
        setSelectedSlot(null); // Limpiar slot seleccionado
    }, []);

    /**
     * Seleccionar un slot
     * @param {object} slot - Slot seleccionado
     */
    const selectSlot = useCallback((slot) => {
        setSelectedSlot(slot);
        if (slot && slot.fecha !== selectedDate) {
            setSelectedDate(slot.fecha);
        }
    }, [selectedDate]);

    /**
     * Limpiar selección
     */
    const clearSelection = useCallback(() => {
        setSelectedDate(null);
        setSelectedSlot(null);
    }, []);

    /**
     * Obtener próximas fechas disponibles
     * @param {number} count - Número de fechas a obtener
     * @returns {Array}
     */
    const getNextAvailableDates = useCallback((count = 5) => {
        const today = new Date();
        const nextDates = [];

        for (let i = 0; i < 30 && nextDates.length < count; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + i);

            if (isDateAvailable(checkDate)) {
                nextDates.push(checkDate);
            }
        }

        return nextDates;
    }, [isDateAvailable]);

    /**
     * Reservar un slot
     * @param {object} appointmentData - Datos de la cita
     * @returns {Promise}
     */
    const bookSlot = useCallback(async (appointmentData) => {
        if (!selectedSlot) {
            throw new Error('No hay slot seleccionado');
        }

        const result = await execute(() =>
            availabilityService.bookSlot(selectedSlot.id, appointmentData)
        );

        // Actualizar disponibilidad local
        setAvailability(prev => prev.map(slot =>
            slot.id === selectedSlot.id
                ? { ...slot, disponible: false }
                : slot
        ));

        // Limpiar selección
        clearSelection();

        return result;
    }, [selectedSlot, execute, clearSelection]);

    return {
        // Estados
        availability,
        selectedDate,
        selectedSlot,
        availableDates,
        loading,
        error,

        // Acciones
        fetchAvailability,
        selectDate,
        selectSlot,
        clearSelection,
        bookSlot,

        // Utilidades
        getSlotsForDate,
        isDateAvailable,
        getNextAvailableDates
    };
};

/**
 * Hook para manejar disponibilidad por especialidad
 * @param {string} specialtyId - ID de la especialidad
 * @returns {object}
 */
export const useSpecialtyAvailability = (specialtyId) => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { execute } = useApi();
    const availability = useAvailability(selectedDoctor?.id, specialtyId);

    /**
     * Obtener doctores disponibles para la especialidad
     */
    const fetchDoctors = useCallback(async () => {
        if (!specialtyId) return;

        try {
            setLoading(true);
            setError(null);

            const result = await execute(() =>
                availabilityService.getDoctorsBySpecialty(specialtyId)
            );

            setDoctors(result);

            // Seleccionar primer doctor por defecto
            if (result.length > 0 && !selectedDoctor) {
                setSelectedDoctor(result[0]);
            }

            return result;
        } catch (error) {
            setError(error.message);
            console.error('Error fetching doctors:', error);
        } finally {
            setLoading(false);
        }
    }, [specialtyId, selectedDoctor, execute]);

    /**
     * Seleccionar un doctor
     * @param {object} doctor - Doctor seleccionado
     */
    const selectDoctor = useCallback((doctor) => {
        setSelectedDoctor(doctor);
        availability.clearSelection();
    }, [availability]);

    /**
     * Obtener próximas citas disponibles para cualquier doctor
     * @param {number} count - Número de citas a obtener
     * @returns {Array}
     */
    const getNextAvailableSlots = useCallback(async (count = 10) => {
        if (!doctors.length) return [];

        const allSlots = [];

        for (const doctor of doctors) {
            try {
                const doctorAvailability = await availabilityService.getAvailability(
                    doctor.id,
                    formatDateForAPI(new Date()),
                    formatDateForAPI(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 días
                );

                const availableSlots = doctorAvailability
                    .filter(slot => slot.disponible)
                    .map(slot => ({
                        ...slot,
                        doctor: doctor
                    }));

                allSlots.push(...availableSlots);
            } catch (error) {
                console.error(`Error fetching availability for doctor ${doctor.id}:`, error);
            }
        }

        // Ordenar por fecha y hora
        allSlots.sort((a, b) => {
            const dateCompare = a.fecha.localeCompare(b.fecha);
            if (dateCompare !== 0) return dateCompare;
            return a.hora_inicio.localeCompare(b.hora_inicio);
        });

        return allSlots.slice(0, count);
    }, [doctors]);

    // Cargar doctores cuando cambia la especialidad
    useEffect(() => {
        if (specialtyId) {
            fetchDoctors();
        }
    }, [specialtyId, fetchDoctors]);

    return {
        // Estados
        doctors,
        selectedDoctor,
        loading: loading || availability.loading,
        error: error || availability.error,

        // Disponibilidad del doctor seleccionado
        ...availability,

        // Acciones específicas
        fetchDoctors,
        selectDoctor,
        getNextAvailableSlots
    };
};

/**
 * Hook para verificar conflictos de horarios
 * @returns {object}
 */
export const useScheduleConflicts = () => {
    const { execute } = useApi();

    /**
     * Verificar si hay conflictos en un horario
     * @param {number} doctorId - ID del doctor
     * @param {string} fecha - Fecha (YYYY-MM-DD)
     * @param {string} horaInicio - Hora de inicio (HH:mm)
     * @param {string} horaFin - Hora de fin (HH:mm)
     * @param {number} excludeAppointmentId - ID de cita a excluir (para edición)
     * @returns {Promise<boolean>}
     */
    const checkConflicts = useCallback(async (doctorId, fecha, horaInicio, horaFin, excludeAppointmentId = null) => {
        const result = await execute(() =>
            availabilityService.checkConflicts(doctorId, fecha, horaInicio, horaFin, excludeAppointmentId)
        );

        return result.hasConflicts;
    }, [execute]);

    /**
     * Obtener detalles de conflictos
     * @param {number} doctorId - ID del doctor
     * @param {string} fecha - Fecha (YYYY-MM-DD)
     * @param {string} horaInicio - Hora de inicio (HH:mm)
     * @param {string} horaFin - Hora de fin (HH:mm)
     * @returns {Promise<Array>}
     */
    const getConflictDetails = useCallback(async (doctorId, fecha, horaInicio, horaFin) => {
        const result = await execute(() =>
            availabilityService.checkConflicts(doctorId, fecha, horaInicio, horaFin)
        );

        return result.conflicts || [];
    }, [execute]);

    return {
        checkConflicts,
        getConflictDetails
    };
};

export default useAvailability;
