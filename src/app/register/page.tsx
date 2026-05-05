'use client';

import React from 'react';
import Link from 'next/link';
import SignUpForm from '@/components/auth/SignUpForm';

/**
 * REGISTER PAGE
 * Purpose: Provides a high-fidelity wrapper for the Vault Forge (Sign Up).
 * Design: Telegram-inspired deep navy aesthetic.
 */
export default function RegisterPage() {

    
    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0f172a] selection:bg-blue-500/30">

            {/* Optional: Simple Logo or Brand Name */}
            <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
                    <svg
                        viewBox="0 0 24 24"
                        className="w-7 h-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-white tracking-wide">WhisperBox</h2>
            </div>

            {/* The Forging Station (Our Form) */}
            <section className="w-full max-w-md">
                <SignUpForm />
            </section>

            {/* Footer Links */}
            <footer className="mt-8 text-center animate-in fade-in duration-1000">
                <p className="text-slate-500 text-sm">
                    Already have a secure vault?{' '}
                    <Link
                        href="/login"
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors underline-offset-4 hover:underline"
                    >
                        Sign In
                    </Link>
                </p>
            </footer>
        </main>
    );
}