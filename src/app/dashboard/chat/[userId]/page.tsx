'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import MessageBubble from '@/components/MessageBubble';

export default function ChatPage({ user, unwrappedKey }: { user: any, unwrappedKey: CryptoKey | null }) {
    const { userId } = useParams(); // This gets the ID of the person you are talking to
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 1. Fetch the "Locked" Messages from the Server
    useEffect(() => {
        const fetchMessages = async () => {
            const token = localStorage.getItem('access_token');
            try {
                const response = await fetch(`https://whisperbox.koyeb.app/conversations/${userId}/messages`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setMessages(data.reverse()); // We reverse so the newest is at the bottom
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
        if (!newMessage.trim()) return;

        // Note: We will implement the "Encrypt & Send" logic here in the next step!
        console.log("Sending message:", newMessage);
        setNewMessage('');
    };




    
    if (loading) return <div className="p-10 text-slate-500 animate-pulse">Opening secure channel...</div>;







    
    return (
        <div className="flex flex-col h-[calc(100vh-180px)]">
            {/* Message List Area */}
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <ol className="flex flex-col" role="list">
                    {messages.map((msg) => (
                        <MessageBubble 
                            key={msg.id} 
                            message={msg} 
                            currentUserId={user?.id} 
                            privateKey={unwrappedKey!} 
                        />
                    ))}
                    <div ref={scrollRef} /> 
                </ol>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="mt-6 flex gap-4 bg-[#1e293b] p-4 rounded-[28px] border border-white/5">
                <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a secure message..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-500 px-4"
                />
                <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-all active:scale-95"
                >
                    Send
                </button>
            </form>
        </div>
    );
}