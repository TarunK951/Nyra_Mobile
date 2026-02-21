import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const storage = {
    async setItem(key, value) {
        if (isWeb) {
            localStorage.setItem(key, value);
        } else {
            const SecureStore = require('expo-secure-store');
            await SecureStore.setItemAsync(key, value);
        }
    },

    async getItem(key) {
        if (isWeb) {
            return localStorage.getItem(key);
        } else {
            const SecureStore = require('expo-secure-store');
            return await SecureStore.getItemAsync(key);
        }
    },

    async deleteItem(key) {
        if (isWeb) {
            localStorage.removeItem(key);
        } else {
            const SecureStore = require('expo-secure-store');
            await SecureStore.deleteItemAsync(key);
        }
    }
};
