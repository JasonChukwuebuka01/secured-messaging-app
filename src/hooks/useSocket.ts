'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export const useSocket = (token: string | null, onMessageReceived: (msg: any) => void) => {
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (!token) return;

        // Clean up existing socket before creating a new one
        if (socketRef.current) {
            socketRef.current.close();
        }

        const ws = new WebSocket(`wss://whisperbox.koyeb.app/ws?token=${token}`);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("✅ WebSocket Connected");
            setIsConnected(true);
            // Clear any pending reconnection attempts
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // Listen for 'message.receive' per your task guidelines
                if (data.event === 'message.receive') {
                    onMessageReceived(data);
                }
            } catch (err) {
                console.error("Failed to parse socket message", err);
            }
        };

        ws.onclose = (event) => {
            console.log("❌ WebSocket Disconnected. Code:", event.code);
            setIsConnected(false);

            // Reconnect logic: Wait 3 seconds before trying again if not closed intentionally
            if (event.code !== 1000 && token) {
                console.log("🔄 Attempting to reconnect in 3s...");
                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, 3000);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket Error:", error);
            ws.close();
        };
    }, [token, onMessageReceived]);

    // Initialize connection
    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) socketRef.current.close(1000); // Normal closure
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [connect]);

    // Using useCallback so we can call this from the UI
    const sendMessage = useCallback((to: string, payload: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
                event: "message.send",
                to,
                payload
            }));
        } else {
            console.error("WebSocket is not open. State:", socketRef.current?.readyState);
        }
    }, []);

    return { isConnected, sendMessage };
};