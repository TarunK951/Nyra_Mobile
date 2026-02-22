import { Platform, StatusBar, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const getStatusBarHeight = () => {
    if (Platform.OS === 'ios') {
        return SCREEN_HEIGHT >= 812 ? 50 : 20;
    }
    return StatusBar.currentHeight || 0;
};

export const layout = {
    statusBarHeight: getStatusBarHeight(),
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    isSmallScreen: SCREEN_WIDTH < 380,
    // Responsive spacing
    px: SCREEN_WIDTH < 380 ? 16 : 20,
    cardRadius: 22,
    cardRadiusLg: 30,
    tabBarHeight: Platform.OS === 'ios' ? 95 : 72,
    tabBarPadBottom: Platform.OS === 'ios' ? 34 : 12,
};
