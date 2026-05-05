'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { unwrapPrivateKey } from '@/lib/crypto/keys';
import { AuthProvider } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [unwrappedKey, setUnwrappedKey] = useState<CryptoKey | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    //  Handle incoming real-time messages
    const handleIncomingMessage = useCallback((data: any) => {
        console.log("New Message arrived via Socket:", data);
        // We dispatch a custom event so specific chat pages can listen for it
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('new-whisper', { detail: data }));
        }
    }, []);

    //  Initialize the WebSocket hook
    const { isConnected, sendMessage } = useSocket(accessToken, handleIncomingMessage);

    useEffect(() => {
        const restoreSession = async () => {
            let token = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');
            const storedWrappingKey = sessionStorage.getItem('temp_wrapping_key');

            if (!token) {
                router.push('/login');
                return;
            }

            try {
                // Fetch profile
                let response = await fetch('https://whisperbox.koyeb.app/auth/me', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                });

                // Refresh logic if token expired
                if (response.status === 401 && refreshToken) {
                    const refreshResponse = await fetch('https://whisperbox.koyeb.app/auth/refresh', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refresh_token: refreshToken })
                    });

                    if (refreshResponse.ok) {
                        const refreshData = await refreshResponse.json();
                        token = refreshData.access_token;
                        localStorage.setItem('access_token', token as string);

                        response = await fetch('https://whisperbox.koyeb.app/auth/me', {
                            method: 'GET',
                            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                        });
                    }
                }

                if (!response.ok) throw new Error('Session invalid');

                const userData = await response.json();
                setUser(userData);
                setAccessToken(token); // Setting this triggers the WebSocket connection

                // Re-materialize the Wrapping Key and unwrap Private Key
                if (storedWrappingKey && userData.wrapped_private_key) {
                    const rawKey = Uint8Array.from(atob(storedWrappingKey), c => c.charCodeAt(0));

                    const wrappingKey = await window.crypto.subtle.importKey(
                        "raw",
                        rawKey,
                        { name: "AES-KW" },
                        false,
                        ["unwrapKey"]
                    );

                    const toUint8Array = (base64: string) => Uint8Array.from(atob(base64), c => c.charCodeAt(0));
                    const wrappedBytes = toUint8Array(userData.wrapped_private_key);

                    const rsaKey = await unwrapPrivateKey(wrappedBytes, wrappingKey);
                    setUnwrappedKey(rsaKey);
                }
            } catch (err) {
                handleLogout();
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, [router]);

    const handleLogout = async () => {
        const token = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');

        try {
            if (token && refreshToken) {
                await fetch('https://whisperbox.koyeb.app/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ refresh_token: refreshToken })
                });
                console.log("✅ Server session revoked.");
            }
        } catch (err) {
            console.error("Failed to notify server of logout:", err);
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            sessionStorage.removeItem('temp_wrapping_key');

            setAccessToken(null);
            setUser(null);
            setUnwrappedKey(null);

            router.push('/login');
        }
    };

    if (loading) return (
        <div className="h-screen bg-[#0f172a] flex flex-col items-center justify-center gap-4">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="text-slate-400 text-sm animate-pulse font-medium">Initializing Vault...</p>
        </div>
    );

    const navItems = [
        { id: 'messages', label: 'Messages', icon: '💬', href: '/dashboard' }
    ];

    return (
        <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden relative">
            {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

            {/* SIDEBAR */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1e293b] border-r border-white/5 flex flex-col transition-transform lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-8 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white tracking-tighter flex items-center gap-3">
                        <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">W</span> WhisperBox
                    </h2>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { router.push(item.href); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${pathname === item.href ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-semibold text-sm">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* --- ADDED DEVELOPER SIGNATURE --- */}
                <div className="px-8 py-4">
                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                        Dev.by <span className="text-blue-400/80 font-bold">Jason Mayicodes</span>
                    </p>
                </div>
                {/* --------------------------------- */}

                <div className="p-6 border-t border-white/5">
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all">
                        <span>🚪</span> <span className="font-bold text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col w-full overflow-hidden">
                <header className="h-16 lg:h-20 border-b border-white/5 flex items-center justify-between px-4 lg:px-10 bg-[#0f172a]/80 backdrop-blur-xl z-30">
                    <button className="lg:hidden p-2 text-white bg-white/5 rounded-lg" onClick={() => setIsSidebarOpen(true)}>☰</button>

                    {/* Status Indicators */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${unwrappedKey ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`}></div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{unwrappedKey ? 'Vault Secured' : 'Vault Locked'}</span>
                        </div>

                        <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-red-500 animate-pulse'}`}></div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{isConnected ? 'Live' : 'Offline'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-white">{user?.username}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{isConnected ? 'Connected' : 'Connecting...'}</p>
                        </div>
                        <div className="h-9 w-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-blue-400">
                            {user?.username?.[0]?.toUpperCase()}
                        </div>
                    </div>
                </header>

                <section className="flex-1 p-4 lg:p-10 overflow-y-auto">
                    <AuthProvider value={{ user, unwrappedKey, sendMessage, isConnected }}>
                        {children}
                    </AuthProvider>
                </section>
            </main>
        </div>
    );
}