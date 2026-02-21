import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightPalette, darkPalette } from './colors';

const ThemeContext = createContext({});

export const ThemeProvider = ({ children }) => {
    const systemScheme = useColorScheme();
    const [themeMode, setThemeMode] = useState(systemScheme || 'light');
    const [styleTheme, setStyleTheme] = useState('solid'); // solid, glass, paper

    useEffect(() => {
        if (systemScheme) {
            setThemeMode(systemScheme);
        }
    }, [systemScheme]);

    const colors = themeMode === 'dark' ? darkPalette : lightPalette;

    const toggleTheme = () => {
        setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const updateStyleTheme = (style) => {
        setStyleTheme(style);
    };

    return (
        <ThemeContext.Provider
            value={{
                themeMode,
                colors,
                styleTheme,
                toggleTheme,
                setThemeMode,
                updateStyleTheme
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
