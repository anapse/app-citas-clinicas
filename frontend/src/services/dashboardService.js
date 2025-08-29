import api from './api';

export const dashboardService = {
    // Obtener estadísticas generales
    getStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },

    // Obtener estadísticas de un doctor
    getDoctorStats: async (doctorId) => {
        const response = await api.get(`/dashboard/doctor/${doctorId}/stats`);
        return response.data;
    },

    // Obtener citas recientes
    getCitasRecientes: async (limite = 10) => {
        const response = await api.get(`/dashboard/citas-recientes?limite=${limite}`);
        return response.data;
    },

    // Obtener alertas del sistema
    getAlertas: async () => {
        const response = await api.get('/dashboard/alertas');
        return response.data;
    }
};
