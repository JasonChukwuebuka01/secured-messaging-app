'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import MessageBubble from '@/components/MessageBubble';
import { encryptMessage } from '@/lib/crypto/messages';
import { useAuth } from '@/context/AuthContext';

export default function ChatPage() {
    // Added sendMessage and isConnected from useAuth
    const { user, unwrappedKey, sendMessage, isConnected } = useAuth();
    const { userId } = useParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch the "Locked" Messages from the Server
    useEffect(() => {
        const fetchMessages = async () => {
            const token = localStorage.getItem('access_token');
            try {
                const response = await fetch(`https://whisperbox.koyeb.app/conversations/${userId}/messages`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data.reverse());
                }
            } catch (err) {
                console.error("Failed to load chat:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, [userId]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        // Added check for isConnected
        if (!newMessage.trim() || !unwrappedKey || !isConnected) return;

        const token = localStorage.getItem('access_token');

        try {
            const userRes = await fetch(`https://whisperbox.koyeb.app/users/${userId}/public-key`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const recipientData = await userRes.json();

            const importKey = async (pem: string) => {
                const binaryDer = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
                return window.crypto.subtle.importKey(
                    "spki",
                    binaryDer,
                    { name: "RSA-OAEP", hash: "SHA-256" },
                    true,
                    ["encrypt"]
                );
            };

            const recipientPubKey = await importKey(recipientData.public_key);
            const myPubKey = await importKey(user.public_key);

            const payload = await encryptMessage(newMessage, recipientPubKey, myPubKey);

            // --- CHANGE START: Use WebSocket instead of fetch POST ---
            if (sendMessage) {
                sendMessage(userId as string, payload);

                // Optimistically add message to UI
                const optimisticMsg = {
                    id: Date.now(), // Temporary ID
                    sender_id: user.id,
                    receiver_id: userId,
                    payload: payload,
                    created_at: new Date().toISOString()
                };

                setMessages(prev => [...prev, optimisticMsg]);
                setNewMessage('');
                console.log("🚀 Message dispatched via WebSocket");
            }
            // --- CHANGE END ---

        } catch (err) {
            console.error("Encryption or Send failed:", err);
            alert("Failed to send secure message.");
        }
    };

    if (loading) return <div className="p-10 text-slate-500 animate-pulse">Opening secure channel...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-180px)]">
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <ol className="flex flex-col" role="list">
                    {
                        messages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                currentUserId={user?.id}
                                privateKey={unwrappedKey!}
                            />
                        ))
                    }
                    <div ref={scrollRef} />
                </ol>
            </div>

            <form onSubmit={handleSend} className="mt-6 flex gap-4 bg-[#1e293b] p-4 rounded-[28px] border border-white/5">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isConnected ? "Type a secure message..." : "Connecting to secure socket..."}
                    disabled={!isConnected}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-500 px-4"
                />
                <button
                    type="submit"
                    disabled={!isConnected}
                    className={`${isConnected ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 cursor-not-allowed'} text-white px-6 py-2 rounded-xl font-bold transition-all active:scale-95`}
                >
                    {isConnected ? 'Send' : '...'}
                </button>
            </form>
        </div>
    );
}