import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DoctorsScreen from '../screens/DoctorsScreen';
import DoctorScheduleScreen from '../screens/DoctorScheduleScreen';
import { useTheme } from '../theme/ThemeContext';

const Stack = createStackNavigator();

const DoctorsNavigator = () => {
    const { colors } = useTheme();
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: 'transparent' },
            }}
        >
            <Stack.Screen name="DoctorsList" component={DoctorsScreen} />
            <Stack.Screen name="DoctorSchedule" component={DoctorScheduleScreen} />
        </Stack.Navigator>
    );
};

export default DoctorsNavigator;
