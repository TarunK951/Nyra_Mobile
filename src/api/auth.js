import apiClient from './client';

export const authApi = {
    // Step 1 - Auth APIs
    login: (credentials) => apiClient.post('/api/auth/login', credentials), // { email/username/phone, password, branch_id? }
    refresh: (refreshToken) => apiClient.post('/api/auth/refresh', { refreshToken }),
    getMe: () => apiClient.get('/api/auth/me'),
    logout: () => apiClient.post('/api/auth/logout'),
    forgotPassword: (email) => apiClient.post('/api/auth/forgot-password', { email }),
    resetPassword: (data) => apiClient.post('/api/auth/reset-password', data), // { token, newPassword, confirmPassword }

    // Step 15 - Profile & Support
    updateProfile: (profileData) => apiClient.put('/api/auth/profile', profileData),
    changePassword: (passwordData) => apiClient.post('/api/auth/change-password', passwordData), // { currentPassword, newPassword, confirmPassword }
};

export const supportApi = {
    getTicket: (id) => apiClient.get(`/api/support/tickets/${id}`),
};
