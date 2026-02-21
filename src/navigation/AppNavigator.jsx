import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import NetworkGate from '../components/NetworkGate';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return null; // Splash / loading state
    }

    return (
        <NavigationContainer>
            <NetworkGate>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    {isAuthenticated ? (
                        <Stack.Screen name="Main" component={DrawerNavigator} />
                    ) : (
                        <Stack.Screen name="Login" component={LoginScreen} />
                    )}
                </Stack.Navigator>
            </NetworkGate>
        </NavigationContainer>
    );
};

export default AppNavigator;
