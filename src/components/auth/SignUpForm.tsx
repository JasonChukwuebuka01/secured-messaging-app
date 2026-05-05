'use client';

import React, { useState } from 'react';
import {
    generateUserKeyPair,
    exportPublicKey,
    deriveWrappingKey,
    wrapPrivateKey
} from '@/lib/crypto/keys';
import { saveVault } from '@/lib/crypto/storage';
import { useRouter } from 'next/navigation';

export default function SignUpForm() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const username = formData.get('username') as string;
        const password = formData.get('password') as string;

        if (!username || password.length < 8) {
            setError("Validation: Username and 8+ char password required.");
            setLoading(false);
            return;
        }

        try {
            
            const keyPair = await generateUserKeyPair();
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const wrappingKey = await deriveWrappingKey(password, salt);
            const wrappedKeyBuffer = await wrapPrivateKey(keyPair.privateKey, wrappingKey);

            // Save locally
            await saveVault(wrappedKeyBuffer, salt);

            // The "Bare Minimum" Payload
            const payload = {
                username: username,
                display_name: username,
                password: password,
                public_key: await exportPublicKey(keyPair.publicKey),
                wrapped_private_key: btoa(String.fromCharCode(...new Uint8Array(wrappedKeyBuffer))),
                pbkdf2_salt: btoa(String.fromCharCode(...new Uint8Array(salt)))
            };

            // 3. API Call
            const response = await fetch('https://whisperbox.koyeb.app/auth/register', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            //  Advanced 422 Debugging
            if (response.status === 422) {
                const apiError = await response.json();
                console.dir(apiError);
                const errorMsg = apiError.detail?.[0]?.msg || apiError.message || 'API Validation Error (422)';
                throw new Error(errorMsg);
            }

            if (!response.ok) {
                throw new Error('Server connectivity issue.');
            }

            const result = await response.json();
            console.log('Account Created Successfully:', result);

            // Trigger Success Toast
            setShowSuccess(true);

            // Wait 2.5 seconds for the user to see the toast, then redirect
            setTimeout(() => {
                router.push('/login');
            }, 2500);

        } catch (err: any) {
            setError(err.message);
            console.error('Registration Error:', err);
        } finally {
            setLoading(false);
        }
    };


    
    return (
        <div className=" flex-col items-center  bg-[#0f172a]  relative overflow-hidden">

            {/* SUCCESS TOAST */}
            {showSuccess && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-[#10b981] text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-semibold tracking-wide">Account created successfully!</span>
                    </div>
                </div>
            )}

            <div className="w-full max-w-md bg-[#1e293b]/50  backdrop-blur-xl border border-white/10 p-8 rounded-[28px] shadow-2xl relative z-10">
               
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="username" className="block text-sm font-medium text-slate-300">Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="off"
                            className="w-full bg-[#0f172a]/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            placeholder="alice_92"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300">Master Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="w-full bg-[#0f172a]/50 border border-white/5 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div role="alert" className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || showSuccess}
                        className={`w-full font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all ${showSuccess
                                ? 'bg-[#10b981] text-white cursor-default'
                                : 'bg-[#2481cc] hover:bg-[#288fde] text-white disabled:opacity-50'
                            }`}
                    >
                        {loading ? 'Processing...' : showSuccess ? 'Success!' : 'Forge Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}