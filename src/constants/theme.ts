export const ARCADE_THEME = {
    colors: {
        background: {
            primary: '#0F0C29',   // Deep dark purple/blue
            secondary: '#302B63', // Mid-tone
            tertiary: '#24243E',  // Darker accent
        },
        neon: {
            pink: '#FF00FF',
            cyan: '#00FFFF',
            yellow: '#FFE600',
            green: '#39FF14',
            purple: '#BC13FE',
            orange: '#FF5E00',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B8C6DB',
        },
        card: { // Transparent layers
            bg: 'rgba(255, 255, 255, 0.05)',
            border: 'rgba(255, 255, 255, 0.1)',
        }
    },
    shadows: {
        neonGlow: (color: string) => ({
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 10, // Android
        }),
        textGlow: (color: string) => ({
            textShadowColor: color,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 10,
        })
    },
    typography: {
        fontFamily: {
            display: 'Anton',
            body: 'Mulish',
            bodyBold: 'Mulish-Bold',
        },
        sizes: {
            xs: 12,
            sm: 14,
            md: 16,
            lg: 18,
            xl: 24,
            xxl: 32,
            display: 48,
        }
    }
};

export const PREMIUM_THEME = {
    colors: {
        primary: '#FFD700',   // Gold
        secondary: '#001B3A', // Deep Blue
        accent: '#E63946',    // Red/Pink for alerts
        background: {
            default: '#001229', // Very dark blue
            paper: '#0A2540',   // Lighter blue for cards
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#94A3B8',
            accent: '#FFD700',
        },
        status: {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6',
        },
        gradients: {
            primary: ['#001B3A', '#0D3B66', '#1A5276'] as const,
            gold: ['#FFD700', '#FFA500'] as const,
            card: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] as const,
        }
    },
    typography: {
        fontFamily: {
            display: 'Anton',
            body: 'Mulish',
            bodyBold: 'Mulish-Bold',
        },
        sizes: {
            xs: 12,
            sm: 14,
            md: 16,
            lg: 18,
            xl: 24,
            xxl: 32,
            display: 48,
        }
    },
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
    },
    shadows: {
        sm: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.22,
            shadowRadius: 2.22,
            elevation: 3,
        },
        md: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.29,
            shadowRadius: 4.65,
            elevation: 7,
        },
        glow: (color: string) => ({
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 10,
            elevation: 5,
        })
    }
};

