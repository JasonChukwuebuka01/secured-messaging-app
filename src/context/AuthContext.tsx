'use client';

import React, { createContext, useContext } from 'react';

// This is the updated "Radio Station" structure
interface AuthContextType {
    user: any;
    unwrappedKey: CryptoKey | null;
    sendMessage?: (to: string, payload: any) => void;
    isConnected?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, value }: { children: React.ReactNode, value: AuthContextType }) {
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// This is the "Tuning Knob" other pages will use
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}