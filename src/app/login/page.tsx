'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deriveWrappingKey, unwrapPrivateKey } from '@/lib/crypto/keys';
import { saveVault } from '@/lib/crypto/storage';

export default function LoginForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const username = (formData.get('username') as string || '').trim();
        const password = (formData.get('password') as string || '');

        try {
            // 1. API LOGIN
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

            // 2. CONVERT DATA
            const toUint8Array = (base64: string) =>
                Uint8Array.from(atob(base64), c => c.charCodeAt(0));

            const saltBytes = toUint8Array(pbkdf2_salt);
            const wrappedBytes = toUint8Array(wrapped_private_key);

            // 3. CRYPTO SYNC
            // This creates an AES-KW key (as per your keys.ts)
            const wrappingKey = await deriveWrappingKey(password, saltBytes);

            // This now correctly expects AES-KW and unrolls the padding
            await unwrapPrivateKey(wrappedBytes, wrappingKey);

            // 4. SAVE & NAVIGATE
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            
            await saveVault(wrappedBytes.buffer as ArrayBuffer, saltBytes);

            // Temporarily hold this in memory for the Dashboard to pick up
            (window as any).tempWrappingKey = wrappingKey;

            setShowSuccess(true);
            setTimeout(() => router.push('/dashboard'), 2000);

        } catch (err: any) {
            // Detailed error differentiation
            const msg = err.name === 'InvalidAccessError'
                ? "Algorithm Mismatch in keys.ts"
                : err.message;
            setError(msg);

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] px-4 font-sans">
            <div className="w-full max-w-md bg-[#1e293b]/50 backdrop-blur-xl border border-white/10 p-8 rounded-[28px] shadow-2xl">
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
                        <label className="block text-sm font-medium text-slate-300 ml-1">Master Password</label>
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
                        {loading ? 'Decrypting...' : showSuccess ? 'Vault Unlocked' : 'Unlock Vault'}
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