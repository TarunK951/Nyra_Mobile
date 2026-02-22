import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import NetworkGate from '../components/NetworkGate';
import GlassBackground from '../components/GlassBackground';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return null; // Splash / loading state
    }

    return (
        <NavigationContainer>
            <NetworkGate>
                {isAuthenticated ? (
                    <GlassBackground>
                        <Stack.Navigator screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="Main" component={DrawerNavigator} />
                        </Stack.Navigator>
                    </GlassBackground>
                ) : (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="Login" component={LoginScreen} />
                    </Stack.Navigator>
                )}
            </NetworkGate>
        </NavigationContainer>
    );
};

export default AppNavigator;
