import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ARCADE_THEME } from '../constants/theme';
import { HeaderBackground } from './HeaderBackground';

const { width } = Dimensions.get('window');

type ArcadeAlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

interface ArcadeAlertProps {
    visible: boolean;
    title?: string;
    message: string;
    type?: ArcadeAlertType;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

export const ArcadeAlert: React.FC<ArcadeAlertProps> = ({
    visible,
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm,
    onCancel
}) => {
    if (!visible) return null;

    // Define icon based on type (simple emojis for now, can be replaced with icons)
    const getIcon = () => {
        switch (type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'confirm': return '❓';
            default: return 'ℹ️';
        }
    };

    // Define colors based on type
    const getThemeColor = () => {
        switch (type) {
            case 'success': return '#ee8432'; // Was neon.green
            case 'error': return ARCADE_THEME.colors.neon.cyan; // Changed from pink to cyan/blue as requested
            case 'warning': return ARCADE_THEME.colors.neon.orange;
            case 'confirm': return ARCADE_THEME.colors.neon.cyan;
            default: return ARCADE_THEME.colors.neon.purple;
        }
    };

    const themeColor = getThemeColor();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onCancel || onConfirm}
        >
            <View style={styles.overlay}>
                {/* Modal Container */}
                <View style={[styles.container, { borderColor: themeColor, ...ARCADE_THEME.shadows.neonGlow(themeColor) }]}>
                    {/* Background Texture */}
                    <HeaderBackground style={[StyleSheet.absoluteFillObject, { borderRadius: 20, opacity: 0.5 }]} />

                    {/* Content */}
                    <View style={styles.content}>
                        {/* Icon Circle */}
                        <View style={[styles.iconCircle, { borderColor: themeColor, backgroundColor: `${themeColor}20` }]}>
                            <Text style={styles.icon}>{getIcon()}</Text>
                        </View>

                        {/* Title */}
                        {title && <Text style={[styles.title, { color: themeColor }]}>{title}</Text>}

                        {/* Message */}
                        <Text style={styles.message}>{message}</Text>

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            {/* Cancel Button (Only for confirm type) */}
                            {type === 'confirm' && onCancel && (
                                <TouchableOpacity onPress={onCancel} style={[styles.button, styles.cancelButton]}>
                                    <Text style={styles.cancelText}>{cancelText}</Text>
                                </TouchableOpacity>
                            )}

                            {/* Confirm Button */}
                            <TouchableOpacity onPress={onConfirm} style={[styles.button, { flex: type === 'confirm' ? 1 : 0, minWidth: 120 }]}>
                                <LinearGradient
                                    colors={[themeColor, themeColor]} // Solid color (gradient start/end same)
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={styles.gradientButton}
                                >
                                    <Text style={styles.confirmText}>{confirmText}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal >
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#0c0d19',
        borderRadius: 24,
        borderWidth: 2,
        overflow: 'hidden',
    },
    content: {
        padding: 30,
        alignItems: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
    },
    icon: {
        fontSize: 40,
    },
    title: {
        fontFamily: ARCADE_THEME.typography.fontFamily.display,
        fontSize: 28,
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: 1,
    },
    message: {
        ...Platform.select({
            web: {
                fontFamily: 'Mulish, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            },
            default: {
                fontFamily: ARCADE_THEME.typography.fontFamily.body,
            }
        }),
        fontSize: 18,
        color: '#E0E0E0',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
        justifyContent: 'center',
    },
    button: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    cancelButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#666',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    gradientButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmText: {
        fontFamily: ARCADE_THEME.typography.fontFamily.display,
        color: '#000',
        fontSize: 18,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    cancelText: {
        ...Platform.select({
            web: {
                fontFamily: 'Mulish, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            },
            default: {
                fontFamily: ARCADE_THEME.typography.fontFamily.body,
            }
        }),
        color: '#AAA',
        fontSize: 16,
    },
});
