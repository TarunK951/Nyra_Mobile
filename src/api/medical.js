import apiClient from './client';

export const medicalApi = {
    // ── Medical Sheets ─────────────────────────────────────────────────────
    getSheet: (id) => apiClient.get(`/api/medical-sheets/${id}`),
    getSheetsByPatient: (patientId) => apiClient.get(`/api/patients/${patientId}/medical-sheets`),
    getSheetByAppointment: (appointmentId) => apiClient.get(`/api/medical-sheets/appointment/${appointmentId}`),
    getSheetPdf: (id) => apiClient.get(`/api/medical-sheets/${id}/pdf`),
    getSheetVersions: (id) => apiClient.get(`/api/medical-sheets/${id}/versions`),

    // ── Invoices ───────────────────────────────────────────────────────────
    getInvoices: (params) => apiClient.get('/api/invoices', { params }),
    getInvoice: (id) => apiClient.get(`/api/invoices/${id}`),
    createInvoice: (data) => apiClient.post('/api/invoices', data),
    updateInvoice: (id, data) => apiClient.put(`/api/invoices/${id}`, data),
    getInvoicePdf: (id) => apiClient.get(`/api/invoices/${id}/pdf`),
    getInvoiceClinicalData: (id) => apiClient.get(`/api/invoices/${id}/clinical-data`),

    // ── Medications (catalog) ──────────────────────────────────────────────
    getMedicines: (params) => apiClient.get('/api/medicines', { params }),
    getMedicine: (id) => apiClient.get(`/api/medicines/${id}`),
    createMedicine: (data) => apiClient.post('/api/medicines', data),
    updateMedicine: (id, data) => apiClient.put(`/api/medicines/${id}`, data),
    deleteMedicine: (id) => apiClient.delete(`/api/medicines/${id}`),

    // ── Treatments ─────────────────────────────────────────────────────────
    getTreatments: (params) => apiClient.get('/api/treatments', { params }),
    getTreatment: (id) => apiClient.get(`/api/treatments/${id}`),
    createTreatment: (data) => apiClient.post('/api/treatments', data),
    updateTreatment: (id, data) => apiClient.put(`/api/treatments/${id}`, data),
    deleteTreatment: (id) => apiClient.delete(`/api/treatments/${id}`),
    getTreatmentHistory: (id) => apiClient.get(`/api/treatments/${id}/history`),
};
