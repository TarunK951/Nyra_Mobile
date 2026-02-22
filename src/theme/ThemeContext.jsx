// ─── NyraAI Theme Context — iOS 26 Liquid Glass ───────────────────
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightPalette, darkPalette } from './colors';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
    const systemScheme = useColorScheme();
    const [themeMode, setThemeMode] = useState(systemScheme || 'light');

    useEffect(() => {
        if (systemScheme) setThemeMode(systemScheme);
    }, [systemScheme]);

    const colors = themeMode === 'dark' ? darkPalette : lightPalette;

    const toggleTheme = () => setThemeMode(p => p === 'light' ? 'dark' : 'light');

    return (
        <ThemeContext.Provider value={{ themeMode, colors, toggleTheme, setThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
