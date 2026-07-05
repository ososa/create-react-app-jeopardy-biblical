import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Platform, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ARCADE_THEME } from '../constants/theme';

export const FullScreenToggle = ({ style }: { style?: any }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        if (Platform.OS === 'web') {
            document.addEventListener('fullscreenchange', handleFullscreenChange);
            return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
        }
    }, []);

    const toggleFullscreen = () => {
        if (Platform.OS !== 'web') return;

        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    if (Platform.OS !== 'web') return null;

    return (
        <TouchableOpacity
            onPress={toggleFullscreen}
            style={[styles.button, style]}
            activeOpacity={0.7}
        >
            <MaterialIcons
                name={isFullscreen ? "fullscreen-exit" : "fullscreen"}
                size={32}
                color={ARCADE_THEME.colors.neon.cyan}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 27, 58, 0.6)',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: ARCADE_THEME.colors.neon.cyan,
        ...ARCADE_THEME.shadows.neonGlow(ARCADE_THEME.colors.neon.cyan),
    }
});
