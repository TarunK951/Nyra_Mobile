import apiClient from './client';

export const reminderCallApi = {
    // ── Reminder Call history ──────────────────────────────────────────
    getAll: (params) => apiClient.get('/api/reminder-calls', { params }),
    // Supported query: appointment_id, hospital_id, branch_id, status, result,
    //                  start_date, end_date, limit, offset
    getById: (id) => apiClient.get(`/api/reminder-calls/${id}`),
    getStats: (params) => apiClient.get('/api/reminder-calls/stats', { params }),

    // ── Queue ──────────────────────────────────────────────────────────
    getQueue: () => apiClient.get('/api/reminder-calls/queue'),
    addToQueue: (data) => apiClient.post('/api/reminder-calls/queue', data),
    // data: { appointment_id, phone_number, patient_name }
    removeFromQueue: (id) => apiClient.delete(`/api/reminder-calls/queue/${id}`),
    bulkTrigger: () => apiClient.post('/api/reminder-calls/queue/bulk-trigger'),
    bulkClear: () => apiClient.delete('/api/reminder-calls/queue/bulk-clear'),

    // ── Test / trigger ─────────────────────────────────────────────────
    triggerReminder: (phone) => apiClient.post('/api/test/reminder-call', { phone }),
    triggerFeedback: (phone) => apiClient.post('/api/test/feedback-call', { phone }),

    // ── Task reminders (separate from "reminder calls") ────────────────
    getReminders: (params) => apiClient.get('/api/reminders', { params }),
    createReminder: (data) => apiClient.post('/api/reminders', data),
    updateReminder: (id, data) => apiClient.put(`/api/reminders/${id}`, data),
    deleteReminder: (id) => apiClient.delete(`/api/reminders/${id}`),
    patchStatus: (id, status) => apiClient.patch(`/api/reminders/${id}/status`, { status }),
};
