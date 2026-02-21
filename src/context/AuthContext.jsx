import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../api/storage';
import { authApi } from '../api/auth';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        loadStorageData();
    }, []);

    async function loadStorageData() {
        try {
            const authDataSerialized = await storage.getItem('user');
            const token = await storage.getItem('accessToken');

            if (token) {
                try {
                    const response = await authApi.getMe();
                    const userData = response.data;
                    setUser(userData);
                    setIsAuthenticated(true);
                    await storage.setItem('user', JSON.stringify(userData));
                } catch (apiError) {
                    console.error('Session restoration failed via API', apiError);
                    // If token is invalid, clear everything
                    await storage.deleteItem('accessToken');
                    await storage.deleteItem('refreshToken');
                    await storage.deleteItem('user');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
        } catch (error) {
            console.error('Error loading auth data', error);
        } finally {
            setLoading(false);
        }
    }

    const login = async (credentials) => {
        try {
            const response = await authApi.login(credentials);
            const { accessToken, refreshToken, user: userData } = response.data;

            await storage.setItem('accessToken', accessToken);
            await storage.setItem('refreshToken', refreshToken);
            await storage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setIsAuthenticated(true);
            return { success: true };
        } catch (error) {
            console.error('Login error', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const logout = async () => {
        try {
            await authApi.logout().catch(() => { }); // Optional backend logout
            await storage.deleteItem('accessToken');
            await storage.deleteItem('refreshToken');
            await storage.deleteItem('user');

            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout error', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
