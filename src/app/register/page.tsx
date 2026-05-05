'use client';

import React from 'react';
import Link from 'next/link';
import SignUpForm from '@/components/auth/SignUpForm';

export default function RegisterPage() {
    return (
        <main className="min-h-screen w-full flex items-center justify-center bg-[#0a0f1a]   p-4">
            
            {/* Main Card - Exact match to aaa.png */}
            <div className="w-full max-w-[480px] bg-[#161d2b] rounded-[32px] border border-white/5 p-12 flex flex-col items-center shadow-2xl">
                
                {/* Logo Section - Shield Icon Retained */}
                <div className="mb-6 bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
                    <svg
                        viewBox="0 0 24 24"
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                </div>

                {/* Header Text - Matching Reference Layout */}
                <header className="text-center mb-10">
                    <h1 className="text-[32px] font-bold text-white mb-2">Sign Up</h1>
                    <p className="text-slate-400 text-sm">WhisperBox Secure Registration</p>
                </header>

                {/* Form Section */}
                <section className="w-full">
                    <SignUpForm />
                </section>

                {/* Footer Section - Matching aaa.png style */}
                <footer className="mt-10 text-center">
                    <p className="text-slate-500 text-sm">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="text-blue-500 hover:text-blue-400 font-bold transition-all ml-1"
                        >
                            Sign In
                        </Link>
                    </p>
                </footer>
            </div>
        </main>
    );
}