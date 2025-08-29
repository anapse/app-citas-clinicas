import api from './api';

export const especialidadesService = {
    // Obtener todas las especialidades
    getEspecialidades: async () => {
        const response = await api.get('/especialidades');
        return response.data;
    },

    // Obtener especialidad por ID
    getEspecialidadById: async (id) => {
        const response = await api.get(`/especialidades/${id}`);
        return response.data;
    },

    // Obtener doctores de una especialidad
    getEspecialidadDoctores: async (id) => {
        const response = await api.get(`/especialidades/${id}/doctores`);
        return response.data;
    },

    // Crear nueva especialidad (solo admin)
    createEspecialidad: async (especialidadData) => {
        const response = await api.post('/especialidades', especialidadData);
        return response.data;
    },

    // Actualizar especialidad (solo admin)
    updateEspecialidad: async (id, especialidadData) => {
        const response = await api.put(`/especialidades/${id}`, especialidadData);
        return response.data;
    },

    // Eliminar especialidad (solo admin)
    deleteEspecialidad: async (id) => {
        const response = await api.delete(`/especialidades/${id}`);
        return response.data;
    }
};
