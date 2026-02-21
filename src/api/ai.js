import apiClient from './client';

export const aiApi = {
    chat: (data) => apiClient.post('/api/ai/chat', data),
    testReminderCall: (phone) => apiClient.post('/api/test/reminder-call', { phone }), // 10 digits
    testFeedbackCall: (phone) => apiClient.post('/api/test/feedback-call', { phone }),
};
