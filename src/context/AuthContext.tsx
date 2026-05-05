
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    user: any;
    unwrappedKey: CryptoKey | null;
    sendMessage?: (to: string, payload: any) => void;
    isConnected?: boolean;
    lastMessage: any | null; // Added to track real-time incoming data
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, value }: { children: React.ReactNode, value: AuthContextType }) {
    // We wrap the provided value to ensure lastMessage remains reactive
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}