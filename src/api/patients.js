import apiClient from './client';

export const patientApi = {
    // List / search
    getAll: (params) => apiClient.get('/api/patients', { params }),
    search: (q, params) => apiClient.get('/api/patients', { params: { search: q, ...params } }),
    getById: (id) => apiClient.get(`/api/patients/${id}`),
    getByPhone: (phone) => apiClient.get(`/api/patients/by-phone/${phone}`),
    getSummary: (id) => apiClient.get(`/api/patients/${id}/summary`),

    // Write
    create: (data) => apiClient.post('/api/patients', data),
    update: (id, data) => apiClient.put(`/api/patients/${id}`, data),
    delete: (id) => apiClient.delete(`/api/patients/${id}`),
    updateField: (data) => apiClient.patch('/api/patients/field', data),
    generateUhid: (id) => apiClient.post(`/api/patients/${id}/generate-uhid`),

    // Relations
    getAttendants: (id) => apiClient.get(`/api/patients/${id}/attendants`),
    addAttendant: (id, data) => apiClient.post(`/api/patients/${id}/attendants`, data),
    getIdentities: (id) => apiClient.get(`/api/patients/${id}/identities`),
    addIdentity: (id, data) => apiClient.post(`/api/patients/${id}/identities`, data),
    verifyIdentity: (id, identityId) => apiClient.post(`/api/patients/${id}/identities/${identityId}/verify`),
    getConsents: (id) => apiClient.get(`/api/patients/${id}/consents`),
    getCallPreferences: (id) => apiClient.get(`/api/patients/${id}/call-preferences`),
    updateCallPrefs: (id, data) => apiClient.patch(`/api/patients/${id}/call-preferences`, data),
    getMedicationHistory: (id) => apiClient.get(`/api/patients/${id}/medication-history`),
    getHistory: (id) => apiClient.get(`/api/patients/${id}/history`),
};
