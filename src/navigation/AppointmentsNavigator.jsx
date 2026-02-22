import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import AppointmentDetailScreen from '../screens/AppointmentDetailScreen';

const Stack = createStackNavigator();

const AppointmentsNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AppointmentsList" component={AppointmentsScreen} />
        <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
    </Stack.Navigator>
);

export default AppointmentsNavigator;
