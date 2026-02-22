import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PatientsScreen from '../screens/PatientListScreen';
import PatientDetailScreen from '../screens/PatientDetailScreen';

const Stack = createStackNavigator();

const PatientsNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PatientList" component={PatientsScreen} />
        <Stack.Screen name="PatientDetail" component={PatientDetailScreen} />
    </Stack.Navigator>
);

export default PatientsNavigator;
