'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UserResult {
    id: string;
    username: string;
    display_name: string;
}

interface Conversation {
    user_id: string;
    display_name: string;
    username: string;
    last_message_at: string;
}

export default function MessagesPage({ user, unwrappedKey }: { user: any, unwrappedKey: CryptoKey | null }) {
    const router = useRouter();
    const dialogRef = useRef<HTMLDialogElement>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [fetchingConversations, setFetchingConversations] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<UserResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Toggle Modal
    const openModal = () => dialogRef.current?.showModal();
    const closeModal = () => {
        dialogRef.current?.close();
        setSearchQuery('');
        setResults([]);
    };

    // Fetch Conversations
    useEffect(() => {
        const fetchConversations = async () => {
            const token = localStorage.getItem('access_token');
            try {
                const response = await fetch('https://whisperbox.koyeb.app/conversations', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setConversations(data);
                }
            } catch (err) {
                console.error("Failed to load conversations", err);
            } finally {
                setFetchingConversations(false);
            }
        };
        fetchConversations();
    }, []);




    // User Search Logic
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length < 2) {
                setResults([]);
                return;
            }
            setIsSearching(true);
            const token = localStorage.getItem('access_token');
            try {
                const response = await fetch(`https://whisperbox.koyeb.app/users/search?q=${searchQuery}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log("Search results for:", searchQuery, data);
                    setResults(data);
                }
            } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header Section */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight mb-2">Messages</h1>
                    <p className="text-slate-400 text-sm">Your end-to-end encrypted conversation threads.</p>
                </div>
                <button
                    onClick={openModal}
                    aria-label="Start a new encrypted chat"
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
                >
                    + New Message
                </button>
            </header>

            {/* --- DIALOG (CENTERED) --- */}
            <dialog
                ref={dialogRef}
                onClose={closeModal}
                className="fixed inset-0 m-auto bg-[#1e293b] text-slate-200 p-0 rounded-[32px] border border-white/10 shadow-2xl backdrop:backdrop-blur-md w-[90%] max-w-md overflow-hidden transition-all"
                aria-labelledby="modal-title"
                role="dialog"
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 id="modal-title" className="text-xl font-bold text-white">Start Conversation</h2>
                        <button onClick={closeModal} aria-label="Close dialog" className="text-slate-500 hover:text-white transition-colors">✕</button>
                    </div>

                    <input
                        type="search"
                        autoFocus
                        placeholder="Search username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search users to chat with"
                        className="w-full bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-6"
                    />

                    <div className="max-h-60 overflow-y-auto space-y-2" role="listbox">
                        {isSearching ? (
                            <p className="text-center text-slate-500 py-4 text-sm animate-pulse">Searching...</p>
                        ) : results.length > 0 ? (
                            results.map((u) => (
                                <button
                                    key={u.id}
                                    role="option"
                                    onClick={() => { router.push(`/dashboard/chat/${u.id}`); closeModal(); }}
                                    className="w-full text-left p-4 rounded-2xl hover:bg-white/5 transition-all flex items-center gap-4 group border border-transparent hover:border-white/5"
                                >
                                    <div className="h-10 w-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">{u.display_name[0]}</div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{u.display_name}</p>
                                        <p className="text-xs text-slate-500 font-mono">@{u.username}</p>
                                    </div>
                                </button>
                            ))
                        ) : searchQuery.length > 1 && <p className="text-center text-slate-500 py-4 text-sm">No results found.</p>}
                    </div>
                </div>
            </dialog>

            {/* --- CONVERSATION LIST & EMPTY STATE --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <nav className="lg:col-span-2 space-y-4" aria-label="Recent conversations">
                    {fetchingConversations ? (
                        <p className="text-slate-500 animate-pulse text-sm">Synchronizing vault...</p>
                    ) : conversations.length > 0 ? (
                        conversations.map((chat) => (
                            <article
                                key={chat.user_id}
                                onClick={() => router.push(`/dashboard/chat/${chat.user_id}`)}
                                className="group p-6 bg-[#1e293b]/30 border border-white/5 rounded-[28px] hover:border-blue-500/30 transition-all cursor-pointer flex justify-between items-center"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-blue-400">
                                        {chat.display_name[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{chat.display_name}</h4>
                                        <p className="text-slate-500 text-xs font-mono">@{chat.username}</p>
                                    </div>
                                </div>
                                <time className="text-[10px] font-bold text-slate-600 uppercase">
                                    {new Date(chat.last_message_at).toLocaleDateString()}
                                </time>
                            </article>
                        ))
                    ) : (
                        /* Semantic Empty State */
                        <div className="p-16 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center text-2xl mb-6">🔒</div>
                            <h3 className="text-xl font-bold text-white mb-2">No conversations yet</h3>
                            <p className="text-slate-500 text-sm max-w-xs mb-8">Start a new encrypted thread to communicate securely with others on the network.</p>
                            <button
                                onClick={openModal}
                                className="text-blue-500 font-bold hover:text-blue-400 transition-colors"
                            >
                                Find someone to message →
                            </button>
                        </div>
                    )}
                </nav>

                <aside className="hidden lg:block">
                    <div className="p-8 bg-white/5 rounded-[32px] border border-white/5">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Security Protocol</h4>
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                            "Messages are encrypted locally using RSA-2048 OAEP.So only you and your intended recipient can read them. Even our servers can't decrypt your conversation. And God. happy secrecy!"
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}