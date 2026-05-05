'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export const useSocket = (token: string | null, onMessageReceived: (msg: any) => void) => {
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

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

    useEffect(() => {
        if (!token) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Based on your guidelines: wss://whisperbox.koyeb.app/ws?token=<access_token>
        const ws = new WebSocket(`wss://whisperbox.koyeb.app/ws?token=${token}`);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log("✅ WebSocket Connected");
            setIsConnected(true);
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

        ws.onclose = () => {
            console.log("❌ WebSocket Disconnected");
            setIsConnected(false);
        };

        ws.onerror = (error) => {
            console.error("WebSocket Error:", error);
        };

        return () => {
            ws.close();
        };
    }, [token, onMessageReceived]);

    return { isConnected, sendMessage };
};