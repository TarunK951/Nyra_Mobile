import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import { ChatProvider } from './src/components/Chat/ChatContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ChatProvider>
          <AppNavigator />
        </ChatProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

