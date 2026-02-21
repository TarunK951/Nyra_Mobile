import apiClient from './client';

export const callApi = {
    // ── Conversations (main) ───────────────────────────────────────────
    // Full list with flexible filters
    getConversations: (params) => apiClient.get('/api/conversations', { params }),

    // Convenience wrappers
    getLiveConversations: () => apiClient.get('/api/conversations', { params: { status: 'live' } }),
    getHistory: (params) => apiClient.get('/api/conversations', { params: { status: 'history', ...params } }),
    getOutboundHistory: (params) => apiClient.get('/api/conversations', { params: { status: 'history', direction: 'OUTBOUND', ...params } }),

    // By ID / related entity
    getConversationById: (id) => apiClient.get(`/api/conversations/${id}`),
    getUserConversations: (userId) => apiClient.get(`/api/conversations/user/${userId}`),
    getConversationByAppointment: (apptId) => apiClient.get(`/api/conversations/appointment/${apptId}`),

    // Transcript & audio
    getTranscript: (sessionId) => apiClient.get(`/api/conversations/${sessionId}/transcript`),
    getAudio: (conversationId) => apiClient.get(`/api/conversations/${conversationId}/audio`),
    getCallAudio: (callId) => apiClient.get(`/api/calls/${callId}/audio`),

    // Live calls (legacy endpoint kept for compat)
    getLiveCalls: () => apiClient.get('/api/calls/live'),

    // Test triggers (used from AI Assist + Follow-up screen)
    testReminderCall: (phone) => apiClient.post('/api/test/reminder-call', { phone }),
    testFeedbackCall: (phone) => apiClient.post('/api/test/feedback-call', { phone }),
};
