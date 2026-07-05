import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// ==========================================
// CONFIGURACIÓN DE DISEÑO (ESTILOS)
// Edita estos valores para ajustar el diseño
// ==========================================
export const LAYOUT_CONFIG = {
    // LOGO
    LOGO_WIDTH_PERCENT: 0.60,      // Reduced to 60% as requested
    LOGO_MAX_WIDTH: 600,           // Ancho máximo en píxeles
    LOGO_HEIGHT: 120,              // Altura del logo (Reduced to fix mobile gap)
    LOGO_MARGIN_BOTTOM: 5,       // Set to 5 as requested

    // TABLERO (BOARD)
    BOARD_WIDTH_PERCENT: 0.90,     // Ancho del tablero relativo a la pantalla (0-1)
    BOARD_MAX_WIDTH: 550,          // Ancho máximo en píxeles
    BOARD_ASPECT_RATIO: 1.25,      // Proporción (Ancho / Alto). Aumentar = más ancho vs alto

    // BOTÓN COMENZAR (START BUTTON)
    BUTTON_WIDTH_PERCENT: 0.90,    // Ancho del botón relativo al tablero/pantalla
    BUTTON_MAX_WIDTH: 400,         // Ancho máximo en píxeles
    BUTTON_MARGIN_TOP: 20,         // Margen positivo para separar del tablero

    // ESPACIADO GENERAL
    SCROLL_PADDING_BOTTOM: 40,    // Espacio extra al final para scroll
};

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: LAYOUT_CONFIG.SCROLL_PADDING_BOTTOM,
        // paddingHorizontal removed to prevent conflict with explicit widths
    },
    topLeftButtons: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 20,
        flexDirection: 'row',
        gap: 10,
    },
    topButtons: {
        position: 'absolute',
        top: 20,
        right: 0,
        zIndex: 100,
        flexDirection: 'row',
    },
    iconButton: {
        padding: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 22, // Half of 44
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
    },

    iconText: {
        fontSize: 20,
    },
    logoContainer: {
        width: '100%',
        alignItems: 'center',
        zIndex: 5,
        marginBottom: LAYOUT_CONFIG.LOGO_MARGIN_BOTTOM,
    },
    logo: {
        // Dynamic styles applied inline based on LAYOUT_CONFIG
        alignSelf: 'center',
        marginHorizontal: 'auto', // CSS fix for precise web centering
    },
    joinBtnContainer: {
        alignSelf: 'center',
        paddingHorizontal: 0,
        borderRadius: 12, // Consistent with other buttons (Login/Start) which use 12
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    joinBtnGradient: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12, // Consistent with container
        borderWidth: 2,
        borderColor: '#81C784',
    },
    joinBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Mulish-Bold',
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    instructionsContainer: {
        width: '90%',
        maxWidth: 600,
        backgroundColor: 'rgba(60, 30, 20, 0.95)', // Darker, richer brown
        borderRadius: 24,
        padding: 30,
        borderWidth: 3,
        borderColor: '#FFD700', // Gold border
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginHorizontal: 'auto',
        marginTop: 0,
        marginBottom: 10,
        // Premium Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },

    startBtnContainer: {
        zIndex: 10,
        marginTop: LAYOUT_CONFIG.BUTTON_MARGIN_TOP,
        alignSelf: 'center',
        width: '90%',
        maxWidth: 400,
        borderRadius: 12,
        overflow: 'hidden',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    startBtnGradient: {
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startBtnText: {
        fontSize: 20,
        fontWeight: 'normal',
        color: '#001B3A',
        fontFamily: 'Anton',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    // Language Switcher Styles
    langContainer: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        width: '100%',
    },
    langButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    langButtonActive: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255,215,0,0.2)',
    },
    langText: {
        fontSize: 24,
    },
});
