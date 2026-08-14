'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/lib/api';
import { formatTime, formatDistanceToNow } from '@/utils/date';
import type { Message, Conversation } from '@/types';
import { MessageBubble } from './MessageBubble';
import { GroupInfoPanel } from './GroupInfoPanel';

export function ChatArea({ send }: { send: (msg: any) => void }) {
  const {
    activeConversationId,
    conversations,
    messages,
    currentUser,
    token,
    typingUsers,
    isConnected,
    setMessages,
    addMessage,
    setActiveConversationId,
  } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const conversationMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const typingIndicators = activeConversationId ? typingUsers[activeConversationId] || [] : [];
  
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversationId || !token) return;
      
      if (messages[activeConversationId]) return;
      
      setIsLoading(true);
      try {
        const msgs = await api.getMessages(activeConversationId, token);
        setMessages(activeConversationId, msgs);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMessages();
  }, [activeConversationId, token]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages.length]);
  
  useEffect(() => {
    if (activeConversationId) {
      send({
        type: 'view_conversation',
        data: {
          conversation_id: activeConversationId,
          is_viewing: true,
        },
      });
    }
    
    return () => {
      if (activeConversationId) {
        send({
          type: 'view_conversation',
          data: {
            conversation_id: activeConversationId,
            is_viewing: false,
          },
        });
      }
    };
  }, [activeConversationId, send]);
  
  const handleTyping = () => {
    if (!activeConversationId) return;
    
    send({
      type: 'typing',
      data: {
        conversation_id: activeConversationId,
        is_typing: true,
      },
    });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      send({
        type: 'typing',
        data: {
          conversation_id: activeConversationId,
          is_typing: false,
        },
      });
    }, 2000);
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !activeConversationId || !isConnected) return;
    
    const content = inputValue.trim();
    setInputValue('');
    
    send({
      type: 'chat',
      data: {
        conversation_id: activeConversationId,
        content,
      },
    });
  };
  
  const getConversationName = (conv: Conversation | undefined): string => {
    if (!conv) return '';
    if (conv.is_group && conv.name) return conv.name;
    const otherParticipant = conv.participants.find((p) => p.user_id !== currentUser?.id);
    return otherParticipant?.display_name || 'Unknown';
  };
  
    const getConversationAvatar = (conv: Conversation | undefined): string => {
      if (!conv) return '';
      if (conv.is_group) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.name || 'Group')}&background=6366f1&color=fff`;
      }
      const otherParticipant = conv.participants.find((p) => p.user_id !== currentUser?.id);
      return otherParticipant?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.display_name || 'U')}&background=6366f1&color=fff`;
    };
    
    if (!activeConversation) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900 relative">
      <div className="flex items-center gap-2 sm:gap-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 sm:px-4 py-3">
        <button 
          onClick={() => setActiveConversationId(null)} 
          className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-full"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <img
          src={getConversationAvatar(activeConversation)}
          alt={getConversationName(activeConversation)}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <h2 className="font-medium text-gray-900 dark:text-gray-100">{getConversationName(activeConversation)}</h2>
          {typingIndicators.length > 0 ? (
            <p className="text-sm text-blue-500">
              {typingIndicators.map((t) => t.user_name).join(', ')} typing...
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeConversation.is_group
                ? `${activeConversation.participants.length} members`
                : (() => {
                    const other = activeConversation.participants.find(
                      (p) => p.user_id !== currentUser?.id
                    );
                    if (!other) return '';
                    if (other.is_online) return 'online';
                    if (other.last_seen) {
                      return `last seen ${formatDistanceToNow(new Date(other.last_seen))} ago`;
                    }
                    return 'offline';
                  })()}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeConversation.is_group && (
            <button onClick={() => setShowGroupInfo(true)} className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50">
              <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          <button className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50">
            <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50">
            <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 dark:border-gray-700 border-t-blue-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {conversationMessages.map((message) => {
              const isOwn = message.sender_id === currentUser?.id;
              
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  showName={activeConversation.is_group && !isOwn}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50"
          >
            <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message"
            className="flex-1 rounded-full bg-gray-100 px-4 py-2 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          
          <button
            type="submit"
            disabled={!inputValue.trim() || !isConnected}
            className="rounded-full bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
      
      {showGroupInfo && activeConversation.is_group && (
        <div className="absolute inset-y-0 right-0 z-20 shadow-2xl">
          <GroupInfoPanel
            conversation={{ ...activeConversation, messages: conversationMessages }}
            onClose={() => setShowGroupInfo(false)}
          />
        </div>
      )}
    </div>
  );
}
