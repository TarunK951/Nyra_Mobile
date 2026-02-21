import apiClient from './client';

export const appointmentApi = {
    // Step 6 - Appointments
    getAll: (params) => apiClient.get('/api/appointments', { params }), // Query: date, patient_id, doctor_id, limit, etc.
    getById: (id) => apiClient.get(`/api/appointments/${id}`),
    create: (data) => apiClient.post('/api/appointments', data),
    update: (id, data) => apiClient.put(`/api/appointments/${id}`, data),
    updateStatus: (id, status) => apiClient.patch(`/api/appointments/${id}/status`, { status }),
    confirm: (id) => apiClient.post(`/api/appointments/${id}/confirm`),
    cancel: (id) => apiClient.post(`/api/appointments/${id}/cancel`),
};

export const queueApi = {
    // Step 7 - Appointment queue (waiting room)
    getAll: () => apiClient.get('/api/appointment-queue'),
    getByDoctor: (doctorId) => apiClient.get(`/api/appointment-queue/doctor/${doctorId}`),
    getWaitingRoom: (params) => apiClient.get('/api/appointment-queue/waiting-room', { params }), // Query: branch_id, doctor_id, date
    updateStatus: (id, status) => apiClient.patch(`/api/appointment-queue/${id}/status`, { status }), // status: "CALLED" | "WAITING" | ...
    callNext: (doctorId) => apiClient.post(`/api/appointment-queue/call-next/${doctorId}`),
};
