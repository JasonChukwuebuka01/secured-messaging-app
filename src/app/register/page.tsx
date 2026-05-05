'use client';

import React from 'react';
import Link from 'next/link';
import SignUpForm from '@/components/auth/SignUpForm';

export default function RegisterPage() {
    return (
        <main className="min-h-screen w-full flex items-center justify-center bg-[#0f172a]">
            
            
            <div className="w-full max-w-[480px] rounded-[32px] border border-white/5 p-4 lg:p-12 flex flex-col items-center shadow-2xl">
                

                {/* Header Text - Matching Reference Layout */}
                <header className="text-center mb-10">
                    <h1 className="text-[32px] font-bold text-white mb-2">Sign Up</h1>
                    <p className="text-slate-400 text-sm">WhisperBox Secure Registration</p>
                </header>

                {/* Form Section */}
                <section className="w-full ">
                    <SignUpForm />
                </section>

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