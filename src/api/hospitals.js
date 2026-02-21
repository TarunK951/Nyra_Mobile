import apiClient from './client';

export const hospitalApi = {
    // Step 3 - Hospitals & branches
    getAll: () => apiClient.get('/api/hospitals'),
    getById: (id) => apiClient.get(`/api/hospitals/${id}`),
};

export const branchApi = {
    getAll: (params) => apiClient.get('/api/branches', { params }), // Query params: hospital_id, etc.
    getById: (id) => apiClient.get(`/api/branches/${id}`),
};
