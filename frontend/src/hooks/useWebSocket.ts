// ============================================================
//  hooks/useWebSocket.ts
//  ---------------------
//  React hook for WebSocket connection management.
//
//  WHAT THIS DOES
//  --------------
//  1. Connects to backend WebSocket with auth token
//  2. Handles incoming messages (chat, typing, status)
//  3. Provides send function for outgoing messages
//  4. Auto-reconnects on disconnect
//  5. Updates Zustand store with received data
// ============================================================

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import type { WebSocketMessage, Message, TypingIndicator } from '@/types';

const WS_URL = 'ws://localhost:8000/ws';

export function useWebSocket() {
  const { token, currentUser, activeConversationId, isConnected, setConnected, addMessage, updateMessageStatus, setTyping, clearTyping, updateUserPresence } = useAppStore();
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const connect = useCallback(() => {
    if (!token || wsRef.current?.readyState === WebSocket.OPEN) return;
    
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      reconnectAttemptsRef.current = 0;
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
      
      // Auto-reconnect with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current++;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (token) {
          connect();
        }
      }, delay);
    };
    
    ws.onerror = (error) => {
      console.warn('WebSocket error:', error);
    };
    
    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };
    
    wsRef.current = ws;
  }, [token, setConnected]);
  
  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'chat':
        const chatData = message.data as unknown as Message;
        addMessage(chatData);
        
        // Send read receipt if it's from someone else
        if (currentUser && chatData.sender_id !== currentUser.id) {
          const isViewing = activeConversationId === chatData.conversation_id;
          const newStatus = isViewing ? 'read' : 'delivered';
          
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'status_update',
              data: {
                message_id: chatData.id,
                status: newStatus
              }
            }));
          }
        }
        break;
        
      case 'typing':
        const typingData = message.data as unknown as TypingIndicator;
        setTyping(typingData.conversation_id, typingData);
        // Clear typing indicator after 3 seconds
        setTimeout(() => {
          clearTyping(typingData.conversation_id, typingData.user_id);
        }, 3000);
        break;
        
      case 'status_update':
        const statusData = message.data as { message_id: number; status: string };
        updateMessageStatus(statusData.message_id, statusData.status);
        break;

      case 'presence_update':
        const presenceData = message.data as { user_id: number; is_online: boolean; last_seen: string };
        updateUserPresence(presenceData.user_id, presenceData.is_online, presenceData.last_seen);
        break;
    }
  }, [addMessage, setTyping, clearTyping, updateMessageStatus, updateUserPresence, currentUser, activeConversationId]);
  
  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }, []);
  
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, [setConnected]);
  
  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);
  
  return {
    isConnected,
    send,
    disconnect,
    reconnect: connect,
  };
}
