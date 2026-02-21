import apiClient from './client';

export const patientApi = {
    // Step 5 - Patients
    getAll: (params) => apiClient.get('/api/patients', { params }), // Query: search, filters, limit, offset
    getById: (id) => apiClient.get(`/api/patients/${id}`),
    getByPhone: (phone) => apiClient.get(`/api/patients/by-phone/${phone}`),
    create: (data) => apiClient.post('/api/patients', data), // phone required for upsert
    update: (id, data) => apiClient.put(`/api/patients/${id}`, data),
    delete: (id) => apiClient.delete(`/api/patients/${id}`),
    updateField: (data) => apiClient.patch('/api/patients/field', data), // { patient_id, field, value }
};
