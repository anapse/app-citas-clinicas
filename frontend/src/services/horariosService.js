import api from './api';

export const horariosService = {
    // Verificar conectividad del backend
    checkBackendConnection: async () => {
        try {
            const response = await api.get('/health', { timeout: 3000 });
            return response.status === 200;
        } catch (error) {
            console.warn('Backend no disponible:', error.message);
            return false;
        }
    },

    // Obtener horarios de un doctor
    getDoctorHorarios: async (doctorId) => {
        const response = await api.get(`/horarios/doctor/${doctorId}`);
        return response.data;
    },

    // Obtener horas disponibles para una fecha específica
    getHorasDisponibles: async (fecha) => {
        const response = await api.get(`/horarios/horas-disponibles?fecha=${fecha}`);
        return response.data;
    },

    // Obtener horarios disponibles por día de la semana
    getHorariosPorDia: async (diaSemana) => {
        const response = await api.get(`/horarios/dia/${diaSemana}`);
        return response.data;
    },

    // Crear nuevo horario
    createHorario: async (doctorId, horarioData) => {
        const response = await api.post(`/horarios/doctor/${doctorId}`, horarioData);
        return response.data;
    },

    // Actualizar horario
    updateHorario: async (id, horarioData) => {
        const response = await api.put(`/horarios/${id}`, horarioData);
        return response.data;
    },

    // Eliminar horario
    deleteHorario: async (id) => {
        const response = await api.delete(`/horarios/${id}`);
        return response.data;
    },

    // Generar horarios por defecto
    generateDefaultHorarios: async (doctorId) => {
        const response = await api.post(`/horarios/doctor/${doctorId}/generar-defaults`);
        return response.data;
    }
};
