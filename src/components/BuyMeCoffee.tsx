import React from 'react';
import { TouchableOpacity, Image, Linking, StyleProp, ViewStyle } from 'react-native';

interface BuyMeCoffeeProps {
    style?: StyleProp<ViewStyle>;
}

export const BuyMeCoffee: React.FC<BuyMeCoffeeProps> = ({ style }) => {
    return (
        <TouchableOpacity
            onPress={() => Linking.openURL('https://www.buymeacoffee.com/tribiblia')}
            style={[{ alignItems: 'center' }, style]}
            activeOpacity={0.8}
        >
            <Image
                source={{ uri: 'https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=tribiblia&button_colour=FFDD00&font_colour=000000&font_family=Inter&outline_colour=000000&coffee_colour=ffffff' }}
                style={{ width: 200, height: 50 }}
                resizeMode="contain"
            />
        </TouchableOpacity>
    );
};
