'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import MessageBubble from '@/components/MessageBubble';
import { encryptMessage } from '@/lib/crypto/messages';
import { useAuth } from '@/context/AuthContext';

export default function ChatPage() {
    const { user, unwrappedKey, sendMessage, isConnected } = useAuth();
    const { userId } = useParams();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const scrollRef = useRef<HTMLDivElement>(null);
    const topObserverRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null); // Ref for the scrollable container
    const isFirstLoad = useRef(true);

    // Fetch Messages with Pagination Support
    const fetchMessages = useCallback(async (before?: string) => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const url = new URL(`https://whisperbox.koyeb.app/conversations/${userId}/messages`);
        if (before) url.searchParams.append('before', before);

        try {
            if (before) setLoadingMore(true);

            // Capture the scroll height before we add new messages to prevent jumping
            const previousHeight = containerRef.current?.scrollHeight || 0;

            const response = await fetch(url.toString(), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();

                if (data.length === 0) {
                    setHasMore(false);
                    return;
                }

                if (!before) {
                    setMessages(data.reverse());
                } else {
                    const olderMessages = data.reverse();
                    setMessages(prev => [...olderMessages, ...prev]);

                    // Adjust scroll position after the DOM updates to keep the view stable
                    setTimeout(() => {
                        if (containerRef.current) {
                            const newHeight = containerRef.current.scrollHeight;
                            containerRef.current.scrollTop = newHeight - previousHeight;
                        }
                    }, 0);
                }
            }
        } catch (err) {
            console.error("Failed to load chat history:", err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [userId]);

    // Initial Load
    useEffect(() => {
        setMessages([]);
        setHasMore(true);
        isFirstLoad.current = true;
        fetchMessages();
    }, [userId, fetchMessages]);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && messages.length > 0) {
                    const oldestMessageTimestamp = messages[0].created_at;
                    fetchMessages(oldestMessageTimestamp);
                }
            },
            { threshold: 0.5 }
        );

        if (topObserverRef.current) {
            observer.observe(topObserverRef.current);
        }

        return () => observer.disconnect();
    }, [messages, hasMore, loading, loadingMore, fetchMessages]);

    // Auto-scroll logic for new messages
    useEffect(() => {
        if (isFirstLoad.current && messages.length > 0) {
            scrollRef.current?.scrollIntoView({ behavior: 'auto' });
            isFirstLoad.current = false;
        } else if (!loadingMore) {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loadingMore]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
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

            if (sendMessage) {
                sendMessage(userId as string, payload);

                const optimisticMsg = {
                    id: Date.now(),
                    sender_id: user.id,
                    receiver_id: userId,
                    payload: payload,
                    created_at: new Date().toISOString()
                };

                setMessages(prev => [...prev, optimisticMsg]);
                setNewMessage('');
            }
        } catch (err) {
            console.error("Send failed:", err);
            alert("Failed to send secure message.");
        }
    };

    if (loading) return <div className="p-10 text-slate-500 animate-pulse">Opening secure channel...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-180px)]">
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto pr-4 custom-scrollbar"
            >
                <ol className="flex flex-col" role="list">
                    <div ref={topObserverRef} className="h-10 flex items-center justify-center">
                        {loadingMore && <span className="text-[10px] text-slate-500 animate-pulse">Loading history...</span>}
                    </div>

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

            <form onSubmit={handleSend} className="mt-6 flex gap-4 bg-[#1e293b] p-4 rounded-[28px] border border-white/5">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isConnected ? "Type a secure message..." : "Connecting..."}
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