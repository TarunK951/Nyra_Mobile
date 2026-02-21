import apiClient from './client';

export const userApi = {
    // Step 4 - Users
    getAll: (params) => apiClient.get('/api/users', { params }), // Query: filters, pagination
    getById: (id) => apiClient.get(`/api/users/${id}`),
    create: (data) => apiClient.post('/api/users', data),
    update: (id, data) => apiClient.put(`/api/users/${id}`, data),
    delete: (id) => apiClient.delete(`/api/users/${id}`),
};
