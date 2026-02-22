import apiClient from './client';

export const callApi = {
    // ── Conversations ───────────────────────────────────────────────────────
    getConversations: (params) => apiClient.get('/api/conversations', { params }),
    getLiveConversations: () => apiClient.get('/api/conversations', { params: { status: 'live' } }),
    getHistory: (params) => apiClient.get('/api/conversations', { params: { status: 'history', ...params } }),
    getOutboundHistory: (params) => apiClient.get('/api/conversations', { params: { status: 'history', direction: 'OUTBOUND', ...params } }),
    getConversationById: (id) => apiClient.get(`/api/conversations/${id}`),
    getUserConversations: (userId) => apiClient.get(`/api/conversations/user/${userId}`),
    getConversationByAppointment: (apptId) => apiClient.get(`/api/conversations/appointment/${apptId}`),
    createConversation: (data) => apiClient.post('/api/conversations', data),

    // ── Transcript & audio ─────────────────────────────────────────────────
    getTranscript: (sessionId) => apiClient.get(`/api/conversations/${sessionId}/transcript`),
    getAudio: (conversationId) => apiClient.get(`/api/conversations/${conversationId}/audio`),
    getCallAudio: (callId) => apiClient.get(`/api/calls/${callId}/audio`),

    // ── Live calls ─────────────────────────────────────────────────────────
    getLiveCalls: () => apiClient.get('/api/calls/live'),
    startCall: (data) => apiClient.post('/api/call/start', data),
    endCall: (data) => apiClient.post('/api/call/end', data),
    outboundCall: (data) => apiClient.post('/api/call/outbound', data),
    bulkCall: (data) => apiClient.post('/api/call/bulk', data),
    getRecording: (recordingId) => apiClient.get(`/api/call/recording/${recordingId}`),

    // ── Sessions ───────────────────────────────────────────────────────────
    getSession: (id) => apiClient.get(`/api/sessions/${id}`),

    // ── AI test triggers ───────────────────────────────────────────────────
    testReminderCall: (phone) => apiClient.post('/api/test/reminder-call', { phone }),
    testFeedbackCall: (phone) => apiClient.post('/api/test/feedback-call', { phone }),

    // ── Missed calls ───────────────────────────────────────────────────────
    getMissedCalls: (params) => apiClient.get('/api/missed-calls', { params }),
};
