import apiClient from './client';

export const appointmentApi = {
    getAll: (params) => apiClient.get('/api/appointments', { params }),
    getCalendar: (params) => apiClient.get('/api/appointments/calendar', { params }),
    getByUser: (userId, params) => apiClient.get(`/api/appointments/by-user/${userId}`, { params }),
    getById: (id) => apiClient.get(`/api/appointments/${id}`),
    getStatus: (id) => apiClient.get(`/api/appointments/${id}/status`),
    create: (data) => apiClient.post('/api/appointments', data),
    update: (id, data) => apiClient.put(`/api/appointments/${id}`, data),
    updateStatus: (id, status) => apiClient.patch(`/api/appointments/${id}/status`, { status }),
    updateField: (data) => apiClient.patch('/api/appointments/field', data),
    confirm: (id) => apiClient.post(`/api/appointments/${id}/confirm`),
    cancel: (id, reason) => apiClient.post(`/api/appointments/${id}/cancel`, { reason }),
    reschedule: (id, data) => apiClient.post(`/api/appointments/${id}/reschedule`, data),
    getRescheduleHistory: (id) => apiClient.get(`/api/appointments/${id}/reschedule-history`),
    getReminderDetails: (id) => apiClient.get(`/api/appointments/${id}/reminder-details`),
};

export const queueApi = {
    getAll: () => apiClient.get('/api/appointment-queue'),
    getByDoctor: (doctorId) => apiClient.get(`/api/appointment-queue/doctor/${doctorId}`),
    getWaitingRoom: (params) => apiClient.get('/api/appointment-queue/waiting-room', { params }),
    add: (data) => apiClient.post('/api/appointment-queue', data),
    updateStatus: (id, status) => apiClient.patch(`/api/appointment-queue/${id}/status`, { status }),
    callNext: (doctorId) => apiClient.post(`/api/appointment-queue/call-next/${doctorId}`),
    startConsultation: (queueId) => apiClient.post(`/api/appointment-queue/${queueId}/start-consultation`),
    completeConsultation: (queueId) => apiClient.post(`/api/appointment-queue/${queueId}/complete-consultation`),
    markNoShow: (queueId) => apiClient.post(`/api/appointment-queue/${queueId}/mark-no-show`),
    remove: (queueId) => apiClient.delete(`/api/appointment-queue/${queueId}`),
};
