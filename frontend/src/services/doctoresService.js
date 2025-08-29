import api from './api';

export const doctoresService = {
    // Obtener todos los doctores
    getDoctores: async (especialidadId = null) => {
        const params = especialidadId ? `?especialidad_id=${especialidadId}` : '';
        const response = await api.get(`/doctores${params}`);
        return response.data;
    },

    // Obtener doctor por ID
    getDoctorById: async (id) => {
        const response = await api.get(`/doctores/${id}`);
        return response.data;
    },

    // Obtener horarios de un doctor
    getDoctorHorarios: async (id) => {
        const response = await api.get(`/doctores/${id}/horarios`);
        return response.data;
    },

    // Obtener citas de un doctor
    getDoctorCitas: async (id, filters = {}) => {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
                params.append(key, filters[key]);
            }
        });

        const response = await api.get(`/doctores/${id}/citas?${params.toString()}`);
        return response.data;
    },

    // Actualizar doctor
    updateDoctor: async (id, doctorData) => {
        const response = await api.put(`/doctores/${id}`, doctorData);
        return response.data;
    },

    // Crear nuevo doctor (solo admin)
    createDoctor: async (doctorData) => {
        const response = await api.post('/doctores', doctorData);
        return response.data;
    }
};
