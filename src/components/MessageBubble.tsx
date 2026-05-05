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

    // CHANGE 1: Standardized the sender check to support both API (sender_id) 
    // and your optimistic UI update (sender_id).
    const isMe = (message.sender_id === currentUserId) || (message.from_user_id === currentUserId);

    useEffect(() => {
        const unlock = async () => {
            // Safety check for required cryptographic components
            if (!message.payload?.ciphertext || !message.payload?.iv) {
                setDecryptedText("⚠️ Error: Malformed message payload.");
                return;
            }

            try {
                //  Enforced strict envelope selection.
                // 'encryptedKeyForSelf' is the copy locked with your own public key.
                // 'encryptedKey' is the copy locked with the recipient's public key.
                const encryptedKeyToUse = isMe
                    ? message.payload.encryptedKeyForSelf
                    : message.payload.encryptedKey;

                if (!encryptedKeyToUse) {
                    throw new Error("No valid key envelope found for this user.");
                }

                // The "Unwrapping" logic
                const clearText = await decryptMessage(
                    message.payload.ciphertext,
                    message.payload.iv,
                    encryptedKeyToUse,
                    privateKey
                );

                setDecryptedText(clearText);
            } catch (err) {
                console.error("Decryption failed:", err);
                // Providing more context for the "OperationError"
                setDecryptedText("⚠️ Error: Decryption failed (Key mismatch).");
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
                className={`max-w-[80%] px-5 py-3 rounded-[24px] text-sm shadow-sm ${isMe
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