import apiClient from './client';

export const treatmentApi = {
    // Step 11 - Medications & treatments
    getAll: (params) => apiClient.get('/api/treatments', { params }), // Query: hospital_id, branch_id
    getById: (id) => apiClient.get(`/api/treatments/${id}`),
    create: (data) => apiClient.post('/api/treatments', data), // incl. hospital_id
    update: (id, data) => apiClient.put(`/api/treatments/${id}`, data),
    delete: (id) => apiClient.delete(`/api/treatments/${id}`),
};

export const medicalSheetApi = {
    // Step 12 - Medical sheets
    getById: (id) => apiClient.get(`/api/medical-sheets/${id}`),
    getByPatientId: (patientId) => apiClient.get(`/api/patients/${patientId}/medical-sheets`),
};

export const invoiceApi = {
    // Step 12 - Invoices
    getAll: (params) => apiClient.get('/api/invoices', { params }), // Query: filters
    getById: (id) => apiClient.get(`/api/invoices/${id}`),
    getPdf: (id) => apiClient.get(`/api/invoices/${id}/pdf`, { responseType: 'blob' }),
};
