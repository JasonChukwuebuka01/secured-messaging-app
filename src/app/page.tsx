'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';


export default function HomePage() {

  const router = useRouter();

  useEffect(() => {
    const confirmAuth = localStorage.getItem('access_token')

    if (confirmAuth) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }

  }, [router]);

  // Show a clean loading state while the redirect is being determined
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#0a0f1a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-medium animate-pulse">
          Initializing secure session...
        </p>
      </div>
    </main>
  );
}