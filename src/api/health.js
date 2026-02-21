import apiClient from './client';

export const healthApi = {
    // Step 2 - Health (optional)
    check: () => apiClient.get('/api/health'),
};
