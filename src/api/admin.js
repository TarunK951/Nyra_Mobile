import apiClient from './client';

export const adminApi = {
    // ── Super Admin Stats ──────────────────────────────────────────────────
    getSuperStats: () => apiClient.get('/api/super-admin/stats'),
    getSuperAnalytics: (params) => apiClient.get('/api/super-admin/analytics', { params }),
    getSuperRevenue: (params) => apiClient.get('/api/super-admin/revenue', { params }),
    getSuperCalls: (params) => apiClient.get('/api/super-admin/calls', { params }),
    getSuperAppointments: (params) => apiClient.get('/api/super-admin/appointments', { params }),

    // ── Services ───────────────────────────────────────────────────────────
    getServices: () => apiClient.get('/api/super-admin/services'),
    createService: (data) => apiClient.post('/api/super-admin/services', data),
    updateServiceStatus: (id, status) => apiClient.patch(`/api/super-admin/services/${id}/status`, { status }),

    // ── Analytics ──────────────────────────────────────────────────────────
    getAllowedAnalytics: () => apiClient.get('/api/analytics/allowed'),

    // ── Settings ───────────────────────────────────────────────────────────
    getSettings: () => apiClient.get('/api/settings'),
    getClinicSettings: () => apiClient.get('/api/settings/clinic'),
    updateClinicSettings: (data) => apiClient.put('/api/settings/clinic', data),
    getRevenueSettings: () => apiClient.get('/api/settings/revenue'),
    updateRevenueSettings: (data) => apiClient.put('/api/settings/revenue', data),
    getDashboardSettings: () => apiClient.get('/api/settings/dashboard'),
    updateDashboardSettings: (data) => apiClient.put('/api/settings/dashboard', data),

    // ── Audit Logs ─────────────────────────────────────────────────────────
    getAuditLogs: (params) => apiClient.get('/api/audit-logs', { params }),
    getAuditLog: (id) => apiClient.get(`/api/audit-logs/${id}`),

    // ── Hospitals ──────────────────────────────────────────────────────────
    getHospitals: (params) => apiClient.get('/api/hospitals', { params }),
    getHospital: (id) => apiClient.get(`/api/hospitals/${id}`),
    getHospitalStats: (id) => apiClient.get(`/api/hospitals/${id}/stats`),
    createHospital: (data) => apiClient.post('/api/hospitals', data),
    updateHospital: (id, data) => apiClient.put(`/api/hospitals/${id}`, data),
    deleteHospital: (id) => apiClient.delete(`/api/hospitals/${id}`),

    // ── Branches ───────────────────────────────────────────────────────────
    getBranches: (params) => apiClient.get('/api/branches', { params }),
    getBranch: (id) => apiClient.get(`/api/branches/${id}`),
    getBranchStats: (id) => apiClient.get(`/api/branches/${id}/stats`),
    createBranch: (data) => apiClient.post('/api/branches', data),
    updateBranch: (id, data) => apiClient.put(`/api/branches/${id}`, data),
    getBranchHours: (id) => apiClient.get(`/api/branches/${id}/operating-hours`),
    updateBranchHours: (id, data) => apiClient.put(`/api/branches/${id}/operating-hours`, data),

    // ── Virtual Numbers ────────────────────────────────────────────────────
    getVirtualNumbers: (params) => apiClient.get('/api/virtual-numbers', { params }),
    getVirtualNumber: (id) => apiClient.get(`/api/virtual-numbers/${id}`),
    createVirtualNumber: (data) => apiClient.post('/api/virtual-numbers', data),
    updateVirtualNumber: (id, data) => apiClient.put(`/api/virtual-numbers/${id}`, data),
    deleteVirtualNumber: (id) => apiClient.delete(`/api/virtual-numbers/${id}`),
};
