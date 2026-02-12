import { Audio } from 'expo-av';

export interface SoundManager {
    correctSound: Audio.Sound | null;
    wrongSound: Audio.Sound | null;
    bonusSound: Audio.Sound | null;
}

export const createSoundManager = async (): Promise<SoundManager> => {
    const soundManager: SoundManager = {
        correctSound: null,
        wrongSound: null,
        bonusSound: null,
    };

    try {
        // Configure audio mode for optimal playback
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
        });

        // Load sounds - in production, these would be actual sound files
        // For now, we'll handle gracefully if they don't exist
        try {
            const { sound: correct } = await Audio.Sound.createAsync(
                require('../assets/sounds/correct.mp3')
            );
            soundManager.correctSound = correct;
        } catch (e) {
            console.log('Correct sound not loaded');
        }

        try {
            const { sound: wrong } = await Audio.Sound.createAsync(
                require('../assets/sounds/wrong.mp3')
            );
            soundManager.wrongSound = wrong;
        } catch (e) {
            console.log('Wrong sound not loaded');
        }

        try {
            const { sound: bonus } = await Audio.Sound.createAsync(
                require('../assets/sounds/bonus.mp3')
            );
            soundManager.bonusSound = bonus;
        } catch (e) {
            console.log('Bonus sound not loaded');
        }
    } catch (error) {
        console.log('Error loading sounds:', error);
    }

    return soundManager;
};

export const playSound = async (sound: Audio.Sound | null): Promise<void> => {
    if (!sound) return;

    try {
        await sound.replayAsync();
    } catch (error) {
        console.log('Error playing sound:', error);
    }
};

export const unloadSounds = async (soundManager: SoundManager): Promise<void> => {
    try {
        await soundManager.correctSound?.unloadAsync();
        await soundManager.wrongSound?.unloadAsync();
        await soundManager.bonusSound?.unloadAsync();
    } catch (error) {
        console.log('Error unloading sounds:', error);
    }
};
