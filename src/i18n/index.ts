import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

const RESOURCES = {
    en: { translation: en },
    es: { translation: es },
    pt: { translation: pt },
};

const initI18n = async () => {
    let savedLanguage = await AsyncStorage.getItem('user-language');

    if (!savedLanguage) {
        // Fallback to device locale, simplified (e.g., 'es-US' -> 'es')
        const deviceLocale = Localization.getLocales()[0]?.languageCode;
        const cleanLocale = deviceLocale?.split('-')[0];

        savedLanguage = cleanLocale && ['en', 'es', 'pt'].includes(cleanLocale)
            ? cleanLocale
            : 'es'; // Default to Spanish if not supported
    }

    i18n
        .use(initReactI18next)
        .init({
            compatibilityJSON: 'v3' as any,
            resources: RESOURCES,
            lng: savedLanguage,
            fallbackLng: 'es',
            interpolation: {
                escapeValue: false,
            },
            react: {
                useSuspense: false, // For React Native compatibility
            },
        });
};

initI18n();

export default i18n;
