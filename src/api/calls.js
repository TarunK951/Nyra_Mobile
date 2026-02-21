import apiClient from './client';

export const callApi = {
    // Step 9 - Calls & conversations
    getLiveCalls: () => apiClient.get('/api/calls/live'),
    getConversations: (params) => apiClient.get('/api/conversations', { params }), // Query: status=live
    getUserConversations: (userId) => apiClient.get(`/api/conversations/user/${userId}`),
    getConversationById: (id) => apiClient.get(`/api/conversations/${id}`),
    getConversationByAppointment: (appointmentId) => apiClient.get(`/api/conversations/appointment/${appointmentId}`),
    testReminderCall: (phone) => apiClient.post('/api/test/reminder-call', { phone }), // 10 digits
    testFeedbackCall: (phone) => apiClient.post('/api/test/feedback-call', { phone }),
};
