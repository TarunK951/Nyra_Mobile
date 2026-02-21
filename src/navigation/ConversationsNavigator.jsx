import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ConversationsScreen from '../screens/ConversationsScreen';
import ConversationDetailScreen from '../screens/ConversationDetailScreen';

const Stack = createStackNavigator();

const ConversationsNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ConversationsList" component={ConversationsScreen} />
        <Stack.Screen name="ConversationDetail" component={ConversationDetailScreen} />
    </Stack.Navigator>
);

export default ConversationsNavigator;
