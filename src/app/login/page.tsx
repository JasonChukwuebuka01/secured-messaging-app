'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deriveWrappingKey, unwrapPrivateKey } from '@/lib/crypto/keys';
import { saveVault } from '@/lib/crypto/storage';

export default function LoginForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const router = useRouter();

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const username = (formData.get('username') as string || '').trim();
        const password = (formData.get('password') as string || '');

        try {
            const response = await fetch('https://whisperbox.koyeb.app/auth/login', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || 'Invalid credentials.');
            }

            const { access_token, user, refresh_token } = result;
            const { wrapped_private_key, pbkdf2_salt } = user;

            const toUint8Array = (base64: string) =>
                Uint8Array.from(atob(base64), c => c.charCodeAt(0));

            const saltBytes = toUint8Array(pbkdf2_salt);
            const wrappedBytes = toUint8Array(wrapped_private_key);

            // Derive and verify key
            const wrappingKey = await deriveWrappingKey(password, saltBytes);
            await unwrapPrivateKey(wrappedBytes, wrappingKey);

            // Storage
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            await saveVault(wrappedBytes.buffer as ArrayBuffer, saltBytes);

            // Session Persistence
            const rawKey = await window.crypto.subtle.exportKey("raw", wrappingKey);
            const wrappingKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
            sessionStorage.setItem('temp_wrapping_key', wrappingKeyBase64);

            // Success State
            showToast("Vault unlocked successfully! Redirecting...", "success");
            setShowSuccess(true);
            setTimeout(() => router.push('/dashboard'), 2000);

        } catch (err: any) {
            let msg = err.message;
            if (err.name === 'InvalidAccessError') msg = "Crypto Error: Key not extractable.";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] px-4 font-sans relative">
            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className={`fixed top-10 right-4 lg:right-10 z-[100] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                    <span className="text-xl">{toast.type === 'success' ? '🛡️' : '⚠️'}</span>
                    <p className="text-sm font-bold">{toast.message}</p>
                </div>
            )}

            <div className="w-full  max-w-md bg-[#1e293b]/50 backdrop-blur-xl border border-white/10 p-8 rounded-[28px] shadow-2xl">

                <header className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">Log In</h1>
                    <p className="text-slate-400 mt-2 text-sm">WhisperBox Secure Access</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300 ml-1">Username</label>
                        <input
                            name="username"
                            type="text"
                            required
                            className="w-full bg-[#0f172a]/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            placeholder="username"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-slate-300 ml-1"> Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-[#0f172a]/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || showSuccess}
                        className={`w-full font-bold py-4 rounded-xl transition-all mt-4 flex justify-center items-center gap-2 ${showSuccess ? 'bg-[#10b981]' : 'bg-[#2481cc] hover:bg-[#288fde]'
                            } text-white disabled:opacity-50`}
                    >
                        {loading ? 'Logging in...' : showSuccess ? 'Vault Unlocked' : 'Unlock Vault'}
                    </button>
                </form>

                <footer className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-sm text-slate-500">
                        Need an account?{' '}
                        <button
                            type="button"
                            onClick={() => router.push('/register')}
                            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                        >
                            Create an account
                        </button>
                    </p>
                </footer>
            </div>
        </div>
    );
}