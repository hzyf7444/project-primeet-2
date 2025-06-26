'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(url?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!url) return;

    console.log('Attempting to connect to:', url);

    const socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: maxReconnectAttempts,
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected successfully:', socketInstance.id);
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('ping');
      }
    }, 30000);

    setSocket(socketInstance);

    return () => {
      clearInterval(heartbeat);
      socketInstance.close();
    };
  }, [url]);

  return { socket, isConnected };
}