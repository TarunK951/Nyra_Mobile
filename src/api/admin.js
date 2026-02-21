import apiClient from './client';

export const adminApi = {
    // Step 13 - Revenue, analytics, settings
    checkAnalyticsAllowed: () => apiClient.get('/api/analytics/allowed'),
    getSettings: () => apiClient.get('/api/settings'),
    getClinicSettings: () => apiClient.get('/api/settings/clinic'),
    getAuditLogs: (params) => apiClient.get('/api/audit-logs', { params }), // Query: limit, offset, filters

    // Step 14 - Super-admin only
    getServices: () => apiClient.get('/api/super-admin/services'),
    getStatistics: () => apiClient.get('/api/super-admin/statistics'),
    getCompanyStats: () => apiClient.get('/api/super-admin/stats'),
    getVirtualNumbers: () => apiClient.get('/api/virtual-numbers'),
    getSuperAdminAnalytics: (params) => apiClient.get('/api/super-admin/analytics', { params }),
};
