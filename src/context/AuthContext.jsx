import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../api/storage';
import { authApi } from '../api/auth';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => { loadStorageData(); }, []);

    async function loadStorageData() {
        try {
            const token = await storage.getItem('accessToken');
            if (token) {
                try {
                    const res = await authApi.getMe();
                    const data = res.data?.user || res.data?.data || res.data;
                    setUser(data);
                    setIsAuthenticated(true);
                    await storage.setItem('user', JSON.stringify(data));
                } catch (e) {
                    // Invalid/expired token — clean up silently
                    console.warn('[Auth] Session restore failed:', e?.response?.status);
                    await _clearAuth();
                }
            }
        } catch (e) {
            console.error('[Auth] loadStorageData error:', e);
        } finally {
            setLoading(false);
        }
    }

    const login = async (credentials) => {
        try {
            const res = await authApi.login(credentials);
            const d = res.data;

            // Support multiple token key conventions from backend
            const accessToken = d.accessToken || d.token || d.access_token;
            const refreshToken = d.refreshToken || d.refresh_token;
            const userData = d.user || d.data || d.profile || d;

            if (accessToken) await storage.setItem('accessToken', accessToken);
            if (refreshToken) await storage.setItem('refreshToken', refreshToken);
            if (userData && userData.id) await storage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setIsAuthenticated(true);
            return { success: true };
        } catch (e) {
            console.error('[Auth] Login error:', e?.response?.status, e?.response?.data);
            return {
                success: false,
                error: e?.response?.data?.message || e?.response?.data?.error || 'Login failed. Please check your credentials.',
            };
        }
    };

    const logout = async () => {
        try { await authApi.logout().catch(() => { }); } catch (_) { }
        await _clearAuth();
    };

    const _clearAuth = async () => {
        await Promise.all([
            storage.deleteItem('accessToken'),
            storage.deleteItem('refreshToken'),
            storage.deleteItem('user'),
        ]);
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
