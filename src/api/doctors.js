import apiClient from './client';

export const doctorApi = {
    // Step 8 - Doctors
    getAll: (params) => apiClient.get('/api/doctors', { params }), // Query: branch_id, etc.
    getById: (id) => apiClient.get(`/api/doctors/${id}`),
    getAvailability: (id) => apiClient.get(`/api/doctors/${id}/availability`),
    setAvailability: (id, availability) => apiClient.put(`/api/doctors/${id}/availability`, availability),
    getScheduleTemplate: (id) => apiClient.get(`/api/doctors/${id}/schedule-template`),
    getAppointments: (id) => apiClient.get(`/api/doctors/${id}/appointments`),
};
