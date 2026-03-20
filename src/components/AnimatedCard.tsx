import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, Pressable, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    Extrapolation
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

interface AnimatedCardProps {
    isFlipped?: boolean;
    onPress?: () => void;
    front: React.ReactNode;
    back: React.ReactNode;
    style?: ViewStyle;
    disabled?: boolean;
    width?: number;
    height?: number;
    testID?: string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    isFlipped = false,
    onPress,
    front,
    back,
    style,
    disabled,
    width,
    height,
    testID
}) => {
    const { theme } = useTheme();
    const rotate = useSharedValue(isFlipped ? 180 : 0);

    useEffect(() => {
        rotate.value = withSpring(isFlipped ? 180 : 0, {
            damping: 12,
            stiffness: 90,
            mass: 0.8
        });
    }, [isFlipped]);

    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(rotate.value, [0, 180], [0, 180], Extrapolation.CLAMP);
        return {
            transform: [{ rotateY: `${rotateValue}deg` }],
            opacity: rotateValue < 90 ? 1 : 0,
            zIndex: rotateValue < 90 ? 1 : 0,
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(rotate.value, [0, 180], [180, 360], Extrapolation.CLAMP);
        return {
            transform: [{ rotateY: `${rotateValue}deg` }],
            opacity: rotateValue > 90 ? 1 : 0,
            zIndex: rotateValue > 90 ? 1 : 0,
        };
    });

    return (
        <Pressable
            testID={testID}
            onPress={onPress}
            disabled={disabled}
            style={[
                styles.container,
                style,
                width ? { width } : undefined,
                height ? { height } : undefined
            ]}
        >
            <View style={styles.cardContainer}>
                <Animated.View
                    style={[
                        styles.face,
                        frontAnimatedStyle,
                        // Removed default backgroundColor to prevent bleeding artifacts
                    ]}
                >
                    {front}
                </Animated.View>
                <Animated.View
                    style={[
                        styles.face,
                        backAnimatedStyle,
                        styles.backFace,
                        // Removed default backgroundColor to prevent bleeding artifacts
                    ]}
                >
                    {back}
                </Animated.View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        // Default dimensions if not provided
        minWidth: 100,
        minHeight: 100,
    },
    cardContainer: {
        flex: 1,
        position: 'relative',
        transform: [{ perspective: 1000 }], // Helps with 3D effect on web
    },
    face: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        backfaceVisibility: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    backFace: {
        // Additional styling for back face if needed
    }
});
