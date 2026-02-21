import React, { createContext, useContext, useState } from 'react';
import ChatOverlay from './ChatOverlay';

const ChatContext = createContext({});

export const ChatProvider = ({ children }) => {
    const [isChatVisible, setIsChatVisible] = useState(false);
    const [currentScreen, setCurrentScreen] = useState('Overview');

    const openChat = (screen) => {
        if (screen) setCurrentScreen(screen);
        setIsChatVisible(true);
    };
    const closeChat = () => setIsChatVisible(false);
    const toggleChat = () => setIsChatVisible(prev => !prev);

    return (
        <ChatContext.Provider value={{ isChatVisible, openChat, closeChat, toggleChat }}>
            {children}
            <ChatOverlay
                visible={isChatVisible}
                onClose={closeChat}
                currentScreen={currentScreen}
            />
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
