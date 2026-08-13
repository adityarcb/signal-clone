import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { useToastStore } from '@/store/toastStore';
import type { User } from '@/types';

interface NewChatModalProps {
  onClose: () => void;
  onStartGroup: () => void;
  onSelectUser: (userId: number) => void;
}

export function NewChatModal({ onClose, onStartGroup, onSelectUser }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { token, setActiveConversationId, setConversations } = useAppStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token || !searchQuery) {
        setUsers([]);
        return;
      }
      setLoading(true);
      try {
        const results = await api.searchUsers(searchQuery, token);
        setUsers(results);
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, token]);

  const handleStartChat = async (userId: number) => {
    if (!token) return;
    try {
      const conv = await api.createDirectConversation(userId, token);
      
      // Update conversations list in store
      const allConvs = await api.getConversations(token);
      setConversations(allConvs);
      
      setActiveConversationId(conv.id);
      onSelectUser(userId);
    } catch (error: any) {
      addToast(error.message || 'Failed to start chat', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-full max-h-[600px] w-full max-w-md flex-col rounded-xl bg-white dark:bg-gray-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">New Chat</h2>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:text-gray-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <button
            onClick={onStartGroup}
            className="flex w-full items-center gap-4 rounded-lg p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="font-medium text-gray-900 dark:text-gray-100">New Group</span>
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by phone number or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 pl-10 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex justify-center p-4 text-gray-500 dark:text-gray-400">Searching...</div>
          ) : users.length === 0 && searchQuery ? (
            <div className="flex justify-center p-4 text-gray-500 dark:text-gray-400">No users found</div>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleStartChat(user.id)}
                className="flex w-full items-center gap-4 rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name)}&background=3b82f6&color=fff`}
                  alt={user.display_name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{user.display_name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{user.phone_number}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
