import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    withSpring,
    runOnJS
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

export const InstructionFlipCard = () => {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const [isFlipped, setIsFlipped] = useState(false);

    // Animation value (0: front, 1: back)
    const spin = useSharedValue(0);

    const handleFlip = () => {
        if (isFlipped) {
            spin.value = withTiming(0, { duration: 600 });
        } else {
            spin.value = withTiming(1, { duration: 600 });
        }
        setIsFlipped(!isFlipped);
    };

    // Front Face Style (Visible when spin is 0)
    const frontStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(spin.value, [0, 1], [0, 180]);
        return {
            transform: [
                { rotateY: `${rotateValue}deg` },
                { perspective: 1000 } // Perspective is crucial for 3D flip
            ],
            opacity: interpolate(spin.value, [0, 0.5, 0.5, 1], [1, 1, 0, 0]),
            zIndex: spin.value < 0.5 ? 1 : 0,
        };
    });

    // Back Face Style (Visible when spin is 1)
    const backStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(spin.value, [0, 1], [180, 360]);
        return {
            transform: [
                { rotateY: `${rotateValue}deg` },
                { perspective: 1000 }
            ],
            opacity: interpolate(spin.value, [0, 0.5, 0.5, 1], [0, 0, 1, 1]),
            zIndex: spin.value > 0.5 ? 1 : 0,
        };
    });

    const isMobile = width < 768;
    const cardWidth = isMobile ? '90%' : 600;
    const cardHeight = isMobile ? undefined : 355;
    const minHeight = isMobile ? undefined : 355;

    return (
        <View style={{ width: cardWidth, height: cardHeight, minHeight: minHeight, alignItems: 'center', justifyContent: 'center', marginTop: 0, marginBottom: 0 }}>
            {/* FRONT FACE: QUÉ ES */}
            <Animated.View style={[styles.cardFace, styles.frontFace, frontStyle, { width: '100%' }]} pointerEvents={isFlipped ? 'none' : 'auto'}>
                <View style={styles.cardContent}>
                    <Text style={styles.title}>{t('instructions.whatIsTitle')}</Text>
                    <Text style={styles.bodyText}>
                        <Text style={styles.highlight}>TRIBIBLIA®</Text> {t('instructions.whatIsBody')}
                    </Text>
                    <TouchableOpacity onPress={handleFlip} style={styles.buttonContainer} activeOpacity={0.8}>
                        <Text style={styles.buttonText}>{t('instructions.howToPlayTitle')}</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* BACK FACE: CÓMO JUGAR */}
            <Animated.View style={[styles.cardFace, styles.backFace, backStyle, { width: '100%', height: '100%' }]} pointerEvents={!isFlipped ? 'none' : 'auto'}>
                <View style={[styles.cardContent, { justifyContent: 'space-between' }]}>
                    <View style={{ width: '100%', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.titleSecondary}>{t('instructions.howToPlayTitle')}</Text>
                        <Text style={styles.bodyText}>
                            {t('instructions.howToPlayBody').split('\n').map((line, index, arr) => (
                                <Text key={index} style={index === arr.length - 1 ? { color: '#FBD642', fontWeight: 'bold' } : {}}>
                                    {line}
                                    {index < arr.length - 1 && '\n'}
                                    {index === 0 && '\n'}
                                </Text>
                            ))}
                        </Text>
                    </View>

                    <TouchableOpacity onPress={handleFlip} style={styles.buttonContainerEmpty} activeOpacity={0.8}>
                        <Text style={[styles.buttonText, { color: '#8B4513' }]}>{t('instructions.whatIsTitle')}</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardFace: {
        // position: 'absolute', // Removed for auto-layout
        backfaceVisibility: 'hidden', // Crucial for hiding the back of the card
        backgroundColor: '#382214', // Dark Brown from design
        borderRadius: 20,
        borderWidth: 3,
        borderColor: '#FFD700', // Gold border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        overflow: 'hidden',
    },
    frontFace: {
        // Front specific styles if any
    },
    backFace: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    cardContent: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontFamily: 'Anton',
        fontSize: 40, // Reduced from 48
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 10, // Reduced from 20
        textTransform: 'uppercase',
    },
    titleSecondary: {
        fontFamily: 'Anton',
        fontSize: 40, // Reduced from 48
        color: '#C28449', // Gold/Bronze color
        textAlign: 'center',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    subTitle: {
        fontFamily: 'Mulish-Regular',
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 10, // Reduced from 15
        lineHeight: 22,
    },
    bodyText: {
        fontFamily: 'Mulish-Regular',
        fontSize: 17,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 22, // Reduced from 26
        marginBottom: 10, // Reduced from 20
    },
    highlight: {
        color: '#FFD700', // Gold
        fontWeight: 'bold',
    },
    bold: {
        fontWeight: 'bold',
        color: '#FFD700',
    },
    buttonContainer: {
        width: 180, // Reduced fixed width
        height: 35, // Reduced height
        borderRadius: 25,
        overflow: 'hidden',
        backgroundColor: '#C28449', // Updated color from design
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonContainerEmpty: {
        width: 180, // Reduced width for the back button
        height: 35, // Reduced height
        borderRadius: 25,
        backgroundColor: '#FFFFFF', // White/Cream
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        fontFamily: 'Mulish-ExtraBold', // Updated font
        color: '#FFFFFF',
        fontSize: 14, // Reduced font size
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 12,
        width: '100%',
        paddingHorizontal: 10,
    },
    bullet: {
        color: '#FFD700',
        fontSize: 20,
        marginRight: 10,
        marginTop: -2,
    },
    bulletText: {
        fontFamily: 'Mulish-Regular',
        fontSize: 16,
        color: '#FFFFFF',
        flex: 1,
        lineHeight: 22,
    }
});
