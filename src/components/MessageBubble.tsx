'use client';

import React, { useState, useEffect } from 'react';
import { decryptMessage } from '@/lib/crypto/messages';

interface MessageProps {
    message: any;
    currentUserId: string;
    privateKey: CryptoKey;
}

export default function MessageBubble({ message, currentUserId, privateKey }: MessageProps) {

    const [decryptedText, setDecryptedText] = useState<string>('Decrypting...');
    const isMe = message.from_user_id === currentUserId;

    useEffect(() => {
        const unlock = async () => {
            try {
                //  Identify which "Padlock" to open
                // If I sent it, use 'encryptedKeyForSelf'. If I received it, use 'encryptedKey'.
                const encryptedKeyToUse = isMe 
                    ? message.payload.encryptedKeyForSelf 
                    : message.payload.encryptedKey;

                // 2. The "Unwrapping"
                // This calls the Web Crypto API to use your Private Key to unlock the AES key
                const clearText = await decryptMessage(
                    message.payload.ciphertext,
                    message.payload.iv,
                    encryptedKeyToUse,
                    privateKey
                );

                setDecryptedText(clearText);
            } catch (err) {
                console.error("Decryption failed:", err);
                setDecryptedText("⚠️ Error: Could not decrypt message.");
            }
        };

        unlock();
    }, [message, privateKey, isMe]);

    return (
        <li 
            className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-4`}
            aria-label={`Message from ${isMe ? 'you' : 'contact'}`}
        >
            <article 
                className={`max-w-[80%] px-5 py-3 rounded-[24px] text-sm shadow-sm ${
                    isMe 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-[#1e293b] text-slate-200 border border-white/5 rounded-bl-none'
                }`}
            >
                <p className="leading-relaxed whitespace-pre-wrap">{decryptedText}</p>
                <time className="block text-[10px] mt-2 opacity-50 font-mono text-right">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </time>
            </article>
        </li>
    );
}