import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

export const Footer = () => {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const year = new Date().getFullYear();

    // Mobile check removed to enable on all devices

    const isSmallScreen = width < 768;

    return (
        <View style={[styles.container, isSmallScreen && styles.containerMobile]}>
            <View style={[styles.linksContainer, isSmallScreen && styles.linksContainerMobile]}>
                <Text style={styles.link} onPress={() => navigation.navigate('AboutUs')}>{t('footer.about')}</Text>
                {!isSmallScreen && <Text style={styles.separator}>|</Text>}

                <Text style={styles.link} onPress={() => navigation.navigate('PrivacyPolicy')}>{t('footer.privacy')}</Text>
                {!isSmallScreen && <Text style={styles.separator}>|</Text>}

                <Text style={styles.link} onPress={() => navigation.navigate('TermsOfUse')}>{t('footer.terms')}</Text>
                {!isSmallScreen && <Text style={styles.separator}>|</Text>}

                <Text style={styles.link} onPress={() => navigation.navigate('CookiesPolicy')}>{t('footer.cookies')}</Text>
            </View>


            <Text style={[styles.text, isSmallScreen && styles.textMobile]}>
                tribiblia® - {year}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignSelf: 'stretch', // Ensure it fills the parent width
        paddingVertical: 5, // Further reduced padding
        backgroundColor: 'transparent', // Transparent to show main background
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 0, // Removed margin
        gap: 5, // Reduced gap between links and copyright
    },
    containerMobile: {
        flexDirection: 'column',
        gap: 8,
        paddingBottom: 10, // Further reduced mobile padding
        marginTop: 20, // Added separation for mobile (Buy Me Coffee button)
    },
    text: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        fontFamily: 'Mulish-Regular',
        letterSpacing: 1,
    },
    textMobile: {
        fontSize: 11,
    },
    linksContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        // marginBottom removed
    },
    linksContainerMobile: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8, // Gap handles spacing between wrapped items
        paddingHorizontal: 20,
    },
    link: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 13,
        fontFamily: 'Mulish-Bold',
        // marginHorizontal removed in favor of gap
        textDecorationLine: 'underline',
    },
    separator: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 10,
    },
    verticalSeparator: {
        width: 1,
        height: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        marginHorizontal: 5,
    }
});
