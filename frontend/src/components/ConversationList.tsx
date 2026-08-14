'use client';

import { useAppStore } from '@/store/appStore';
import type { Conversation } from '@/types';
import { formatDistanceToNow } from '../utils/date';
import { NewChatModal } from './NewChatModal';
import { NewGroupModal } from './NewGroupModal';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface ConversationListProps {
  onSelectConversation: (id: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ConversationList({
  onSelectConversation,
  searchQuery,
  onSearchChange,
}: ConversationListProps) {
  const { conversations, activeConversationId, currentUser, token, setActiveConversationId, setConversations } = useAppStore();
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !token) {
        setSearchResults([]);
        return;
      }
      
      setIsSearching(true);
      try {
        const results = await api.searchUsers(searchQuery, token);
        // Filter out current user and users we already have a 1:1 chat with
        const filtered = results.filter(user => {
          if (user.id === currentUser?.id) return false;
          // Check if we have a direct chat
          const hasDirectChat = conversations.some(
            c => !c.is_group && c.participants.some(p => p.user_id === user.id)
          );
          return !hasDirectChat;
        });
        setSearchResults(filtered);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsSearching(false);
      }
    };
    
    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, token, currentUser, conversations]);

  const handleStartDirectChat = async (userId: number) => {
    if (!token) return;
    try {
      const conv = await api.createDirectConversation(userId, token);
      const allConvs = await api.getConversations(token);
      setConversations(allConvs);
      setActiveConversationId(conv.id);
      onSearchChange(''); // Clear search
    } catch (err) {
      console.error('Failed to start chat', err);
    }
  };
  
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    if (conv.is_group && conv.name) {
      return conv.name.toLowerCase().includes(searchLower);
    }
    const participant = conv.participants.find((p) => p.user_id !== currentUser?.id);
    return participant?.display_name.toLowerCase().includes(searchLower);
  });
  
  const getConversationName = (conv: Conversation): string => {
    if (conv.is_group && conv.name) return conv.name;
    const otherParticipant = conv.participants.find((p) => p.user_id !== currentUser?.id);
    return otherParticipant?.display_name || 'Unknown';
  };
  
  const getConversationAvatar = (conv: Conversation): string => {
    if (conv.is_group) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.name || 'Group')}&background=6366f1&color=fff`;
    }
    const otherParticipant = conv.participants.find((p) => p.user_id !== currentUser?.id);
    return otherParticipant?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.display_name || 'U')}&background=6366f1&color=fff`;
  };
  
  const getLastMessageTime = (conv: Conversation): string => {
    if (!conv.last_message) return '';
    return formatDistanceToNow(conv.last_message.timestamp);
  };
  
  const getLastMessagePreview = (conv: Conversation): string => {
    if (!conv.last_message) return 'No messages yet';
    const content = conv.last_message.content;
    return content.length > 40 ? content.substring(0, 40) + '...' : content;
  };
  
  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-800">
      <div className="border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg
            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {searchQuery && (
          <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Conversations
          </div>
        )}
        
        {filteredConversations.length === 0 && !searchQuery ? (
          <div className="flex h-32 items-center justify-center text-gray-500 dark:text-gray-400">
            No conversations found
          </div>
        ) : filteredConversations.length === 0 && searchQuery ? (
          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No matching conversations</div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`flex cursor-pointer items-center gap-3 border-b border-gray-100 dark:border-gray-700/50 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                activeConversationId === conv.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
              }`}
            >
              <div className="relative">
                <img
                  src={getConversationAvatar(conv)}
                  alt={getConversationName(conv)}
                  className="h-12 w-12 rounded-full object-cover"
                />
              </div>
              
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className={`text-gray-900 dark:text-gray-100 ${conv.unread_count > 0 ? 'font-bold' : 'font-medium'}`}>
                    {getConversationName(conv)}
                  </span>
                  {conv.last_message && (
                    <span className={`text-xs ${conv.unread_count > 0 ? 'text-blue-600 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                      {getLastMessageTime(conv)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className={`truncate text-sm ${conv.unread_count > 0 ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                    {getLastMessagePreview(conv)}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {searchQuery && (
          <>
            <div className="px-4 py-2 mt-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700/50">
              Global Search
            </div>
            {isSearching ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Searching...</div>
            ) : searchResults.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No new contacts found</div>
            ) : (
              searchResults.map(user => (
                <div
                  key={user.id}
                  onClick={() => handleStartDirectChat(user.id)}
                  className="flex cursor-pointer items-center gap-3 border-b border-gray-100 dark:border-gray-700/50 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <img
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name)}&background=3b82f6&color=fff`}
                    alt={user.display_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1 overflow-hidden">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{user.display_name}</span>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">{user.phone_number}</p>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Compose FAB */}
      <div className="absolute bottom-6 right-6">
        <button
          onClick={() => setShowNewChat(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onStartGroup={() => {
            setShowNewChat(false);
            setShowNewGroup(true);
          }}
          onSelectUser={(userId) => {
            setShowNewChat(false);
            // Logic to start chat will be handled inside NewChatModal, it will call onSelectConversation
          }}
        />
      )}

      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
        />
      )}
    </div>
  );
}
