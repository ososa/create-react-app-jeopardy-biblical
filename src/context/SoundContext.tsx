import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { Audio } from 'expo-av';

type SoundType = 'correct' | 'incorrect' | 'timeout' | 'bonus' | 'click' | 'background';

interface SoundContextType {
    playSound: (type: SoundType) => Promise<void>;
    stopSound: (type: SoundType) => Promise<void>;
    isMuted: boolean;
    toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider = ({ children }: { children: ReactNode }) => {
    const [isMuted, setIsMuted] = useState(false);
    const sounds = useRef<{ [key in SoundType]?: Audio.Sound }>({});

    // Sound mappings
    const soundFiles: { [key in SoundType]?: any } = {
        correct: require('../../assets/sounds/correct.mp3'),
        incorrect: require('../../assets/sounds/incorrect.mp3'),
        timeout: require('../../assets/sounds/ring.mp3'),
        bonus: require('../../assets/sounds/streak_bonus.mp3'),
        // click: require('../../assets/sounds/click.mp3'), // Add if available
        // background: require('../../assets/sounds/bgm.mp3'), // Add if available
    };

    useEffect(() => {
        // Cleanup sounds on unmount
        return () => {
            Object.values(sounds.current).forEach(async (sound) => {
                try {
                    await sound.unloadAsync();
                } catch (e) {
                    console.warn('Error unloading sound', e);
                }
            });
        };
    }, []);

    const playSound = async (type: SoundType) => {
        if (isMuted) return;

        try {
            const soundSource = soundFiles[type];
            if (!soundSource) return;

            // If sound is already loaded, replay it
            if (sounds.current[type]) {
                await sounds.current[type]!.replayAsync();
                return;
            }

            // Otherwise, load and play
            const { sound } = await Audio.Sound.createAsync(soundSource);
            sounds.current[type] = sound;
            await sound.playAsync();

            // Optional: Unload some sounds if they are heavy, or keep them for re-use (better for games)
            // For now, we keep them loaded for responsiveness.
        } catch (error) {
            console.log(`Error playing sound ${type}`, error);
        }
    };

    const stopSound = async (type: SoundType) => {
        try {
            const sound = sounds.current[type];
            if (sound) {
                await sound.stopAsync();
            }
        } catch (error) {
            console.log(`Error stopping sound ${type}`, error);
        }
    };

    const toggleMute = () => {
        setIsMuted((prev) => !prev);
    };

    return (
        <SoundContext.Provider value={{ playSound, stopSound, isMuted, toggleMute }}>
            {children}
        </SoundContext.Provider>
    );
};

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};
