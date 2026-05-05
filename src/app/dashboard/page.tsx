'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Conversation {
    user_id: string;
    display_name: string;
    username: string;
    last_message_at: string;
}

export default function MessagesPage({ user, unwrappedKey }: { user: any, unwrappedKey: CryptoKey | null }) {
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchConversations = async () => {
            const token = localStorage.getItem('access_token');
            try {
                const response = await fetch('https://whisperbox.koyeb.app/conversations', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setConversations(data);
                };

            } catch (err) {
                console.error("Failed to load conversations:", err);
            } finally {
                setFetching(false);
            }
        };

        fetchConversations();
    }, []);





    

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header Section */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-2">
                        Messages
                    </h1>
                    <p className="text-slate-400 text-sm lg:text-base">
                        Select a conversation to start decrypting.
                    </p>
                </div>
                <button
                    aria-label="Start a new message"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
                >
                    + New Message
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Conversations List */}
                <nav aria-label="Conversation list" className="lg:col-span-2 space-y-4">
                    {fetching ? (
                        <p className="text-slate-500 animate-pulse text-sm">Loading your chats...</p>
                    ) : conversations.length > 0 ? (
                        conversations.map((chat) => (
                            <article
                                key={chat.user_id}
                                onClick={() => router.push(`/dashboard/chat/${chat.user_id}`)}
                                className="group p-6 bg-[#1e293b]/30 border border-white/5 rounded-[28px] hover:border-blue-500/30 hover:bg-[#1e293b]/50 transition-all cursor-pointer flex justify-between items-center"
                                aria-label={`Conversation with ${chat.display_name}`}
                            >
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="h-12 w-12 rounded-full bg-slate-800 border border-white/10 flex-shrink-0 flex items-center justify-center font-bold text-blue-400">
                                        {chat.display_name[0].toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                                            {chat.display_name}
                                        </h4>
                                        <p className="text-slate-500 text-xs font-mono truncate">
                                            @{chat.username}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <time className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                        {new Date(chat.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </time>
                                    <div className="mt-1 text-[10px] text-blue-500/60 font-black">
                                        RSA-2048
                                    </div>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="p-12 border-2 border-dashed border-white/5 rounded-[32px] text-center">
                            <p className="text-slate-500 mb-4 text-sm">No conversations found.</p>
                            <button className="text-blue-500 font-bold text-sm hover:underline">Start your first chat</button>
                        </div>
                    )}
                </nav>

                {/* Status Sidebar */}
                <aside aria-label="Security Status" className="space-y-6">
                    <section className="p-8 bg-gradient-to-b from-blue-600/10 to-transparent border border-blue-500/10 rounded-[32px]">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Vault Summary</h4>
                        <ul className="space-y-4" role="list">
                            <li className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Identity</span>
                                <span className="text-white font-bold underline decoration-blue-500 underline-offset-4">Verified</span>
                            </li>
                            <li className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Private Key</span>
                                <span className={`font-bold ${unwrappedKey ? 'text-green-500' : 'text-yellow-500'}`}>
                                    {unwrappedKey ? 'Restored' : 'Locked'}
                                </span>
                            </li>
                        </ul>
                    </section>
                </aside>
            </div>
        </div>
    );
}