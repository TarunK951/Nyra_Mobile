import apiClient from './client';

export const notificationApi = {
    // Step 10 - Notifications
    getAll: (params) => apiClient.get('/api/notifications', { params }), // Query: limit, offset
    getUnreadCount: () => apiClient.get('/api/notifications/unread-count'),
    markAsRead: (id) => apiClient.put(`/api/notifications/${id}/read`),
    markAllAsRead: () => apiClient.put('/api/notifications/read-all'),
};
