'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export const useSocket = (token: string | null, onMessageReceived: (msg: any) => void) => {
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // FIX 1: Store the callback in a ref so the socket logic never needs to change
    const onMessageRef = useRef(onMessageReceived);
    useEffect(() => {
        onMessageRef.current = onMessageReceived;
    }, [onMessageReceived]);

    const connect = useCallback(() => {
        if (!token || socketRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(`wss://whisperbox.koyeb.app/ws?token=${token}`);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("✅ WebSocket Connected");
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // FIX 2: Broaden the check. Some backends send the message object directly
                // or use different event keys.
                if (data.event === 'message.receive' || data.payload || data.sender_id) {
                    onMessageRef.current(data);
                }
            } catch (err) {
                console.error("Failed to parse socket message", err);
            }
        };

        ws.onclose = (event) => {
            setIsConnected(false);
            if (event.code !== 1000 && token) {
                reconnectTimeoutRef.current = setTimeout(() => connect(), 3000);
            }
        };

        ws.onerror = () => ws.close();
    }, [token]); // Removed onMessageReceived from dependencies to prevent restart loops

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) socketRef.current.close(1000);
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [connect]);

    const sendMessage = useCallback((to: string, payload: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                event: "message.send",
                to,
                payload
            }));
        }
    }, []);

    return { isConnected, sendMessage };
};