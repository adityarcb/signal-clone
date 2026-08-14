import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { useToastStore } from '@/store/toastStore';
import type { ConversationDetail, User } from '@/types';

interface GroupInfoPanelProps {
  conversation: ConversationDetail;
  onClose: () => void;
}

export function GroupInfoPanel({ conversation, onClose }: GroupInfoPanelProps) {
  const { currentUser, token, setActiveConversationId, setConversations } = useAppStore();
  const { addToast } = useToastStore();
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const currentParticipant = conversation.participants.find(p => p.user_id === currentUser?.id);
  const isAdmin = currentParticipant?.is_admin || false;

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!token || !query) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await api.searchUsers(query, token);
      setSearchResults(results.filter(u => !conversation.participants.some(p => p.user_id === u.id)));
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const handleAddMember = async (userId: number) => {
    if (!token) return;
    setLoading(true);
    try {
      await api.addGroupMember(conversation.id, userId, token);
      addToast('Member added successfully', 'success');
      setShowAddMember(false);
      setSearchQuery('');
      setSearchResults([]);
      // Reload conversations
      const allConvs = await api.getConversations(token);
      setConversations(allConvs);
      const updated = await api.getConversation(conversation.id, token);
      useAppStore.getState().setActiveConversationId(conversation.id);
    } catch (error: any) {
      addToast(error.message || 'Failed to add member', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!token) return;
    try {
      await api.removeGroupMember(conversation.id, userId, token);
      addToast('Member removed', 'success');
      // Reload conversations
      const allConvs = await api.getConversations(token);
      setConversations(allConvs);
    } catch (error: any) {
      addToast(error.message || 'Failed to remove member', 'error');
    }
  };

  const handleLeaveGroup = async () => {
    if (!token) return;
    try {
      await api.leaveGroup(conversation.id, token);
      addToast('Left group', 'success');
      setActiveConversationId(null);
      const allConvs = await api.getConversations(token);
      setConversations(allConvs);
    } catch (error: any) {
      addToast(error.message || 'Failed to leave group', 'error');
    }
  };

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Group Info</h2>
        <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:text-gray-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col items-center p-6 border-b border-gray-200 dark:border-gray-700">
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.name || 'Group')}&background=6366f1&color=fff&size=128`}
          alt={conversation.name || 'Group'}
          className="h-24 w-24 rounded-full object-cover shadow-sm mb-4"
        />
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{conversation.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{conversation.participants.length} members</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Members</h4>
            {isAdmin && !showAddMember && (
              <button onClick={() => setShowAddMember(true)} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Add
              </button>
            )}
          </div>

          {showAddMember && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                />
                <button onClick={() => setShowAddMember(false)} className="ml-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700">Cancel</button>
              </div>
              {searchResults.length > 0 && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 p-2 max-h-40 overflow-y-auto">
                  {searchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleAddMember(user.id)}
                      disabled={loading}
                      className="flex w-full items-center justify-between rounded p-2 text-left hover:bg-gray-200 dark:hover:bg-gray-600/50 disabled:opacity-50"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.display_name}</span>
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            {conversation.participants.map(p => (
              <div key={p.user_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.display_name)}&background=3b82f6&color=fff`}
                    alt={p.display_name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {p.user_id === currentUser?.id ? 'You' : p.display_name}
                    </div>
                    {p.is_admin && <div className="text-xs text-blue-600 font-medium">Admin</div>}
                  </div>
                </div>
                {isAdmin && p.user_id !== currentUser?.id && (
                  <button onClick={() => handleRemoveMember(p.user_id)} className="text-xs text-red-600 hover:text-red-800">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4">
          <button
            onClick={handleLeaveGroup}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
}
