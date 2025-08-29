import api from './api';

export const citasService = {
    // Obtener todas las citas con filtros
    getCitas: async (filters = {}) => {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
                params.append(key, filters[key]);
            }
        });

        const response = await api.get(`/citas?${params.toString()}`);
        return response.data;
    },

    // Obtener cita por ID
    getCitaById: async (id) => {
        const response = await api.get(`/citas/${id}`);
        return response.data;
    },

    // Crear nueva cita
    createCita: async (citaData) => {
        const response = await api.post('/citas', citaData);
        return response.data;
    },

    // Actualizar cita
    updateCita: async (id, citaData) => {
        const response = await api.put(`/citas/${id}`, citaData);
        return response.data;
    },

    // Cancelar cita
    cancelCita: async (id) => {
        const response = await api.delete(`/citas/${id}`);
        return response.data;
    },

    // Cambiar estado de cita
    changeEstado: async (id, estadoId, observaciones = '') => {
        const response = await api.put(`/citas/${id}`, {
            estado_id: estadoId,
            observaciones
        });
        return response.data;
    }
};
