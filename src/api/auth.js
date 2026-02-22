import apiClient from './client';

export const authApi = {
    // Step 1 - Auth APIs
    login: (credentials) => apiClient.post('/api/auth/login', credentials), // { email/username/phone, password, branch_id? }
    refresh: (refreshToken) => apiClient.post('/api/auth/refresh', { refreshToken }),
    getMe: () => apiClient.get('/api/auth/me'),
    logout: () => apiClient.post('/api/auth/logout'),
    forgotPassword: (email) => apiClient.post('/api/auth/forgot-password', { email }),
    sendOtp: (data) => apiClient.post('/api/auth/forgot-password/send-otp', data), // { email/phone, channel: "EMAIL"|"SMS" }
    verifyOtp: (data) => apiClient.post('/api/auth/forgot-password/verify-otp', data), // { email/phone, otp, newPassword }
    resetPassword: (data) => apiClient.post('/api/auth/reset-password', data), // { token, newPassword }

    // Step 15 - Profile & Support
    updateProfile: (profileData) => apiClient.put('/api/auth/profile', profileData),
    changePassword: (passwordData) => apiClient.post('/api/auth/change-password', passwordData), // { currentPassword, newPassword, confirmPassword }
};

export const supportApi = {
    getTicket: (id) => apiClient.get(`/api/support/tickets/${id}`),
};
