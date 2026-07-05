import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PREMIUM_THEME, ARCADE_THEME } from '../constants/theme';

// We prioritize the new Premium Theme structure
type Theme = typeof PREMIUM_THEME | typeof ARCADE_THEME;

interface ThemeContextType {
    theme: typeof PREMIUM_THEME; // Defaulting type to Premium for better intellisense
    themeName: 'arcade' | 'premium';
    setTheme: (name: 'arcade' | 'premium') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [themeName, setThemeName] = useState<'arcade' | 'premium'>('premium');

    // We cast ARCADE_THEME to any to avoid strict type conflicts during migration
    // In a real scenario, we would harmonize the types.
    const theme = (themeName === 'arcade' ? ARCADE_THEME : PREMIUM_THEME) as typeof PREMIUM_THEME;

    return (
        <ThemeContext.Provider value={{ theme, themeName, setTheme: setThemeName }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
