import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/appStore';
import { useToastStore } from '@/store/toastStore';
import type { User } from '@/types';

interface NewGroupModalProps {
  onClose: () => void;
}

export function NewGroupModal({ onClose }: NewGroupModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { token, setActiveConversationId, setConversations } = useAppStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token || !searchQuery) {
        setUsers([]);
        return;
      }
      try {
        const results = await api.searchUsers(searchQuery, token);
        setUsers(results);
      } catch (error) {
        console.error('Failed to search users:', error);
      }
    };
    
    const timeoutId = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, token]);

  const toggleUser = (user: User) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateGroup = async () => {
    if (!token || !groupName.trim() || selectedUsers.length === 0) return;
    
    setLoading(true);
    try {
      const participantIds = selectedUsers.map((u) => u.id);
      const conv = await api.createGroup(groupName.trim(), participantIds, token);
      
      const allConvs = await api.getConversations(token);
      setConversations(allConvs);
      
      setActiveConversationId(conv.id);
      addToast('Group created successfully', 'success');
      onClose();
    } catch (error: any) {
      addToast(error.message || 'Failed to create group', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-full max-h-[600px] w-full max-w-md flex-col rounded-xl bg-white dark:bg-gray-800 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:text-gray-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {step === 1 ? 'Add Members' : 'New Group'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:text-gray-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 1 ? (
          <>
            <div className="p-4">
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/50 px-3 py-1 text-sm text-blue-700 dark:text-blue-300">
                    <span>{user.display_name}</span>
                    <button onClick={() => toggleUser(user)} className="text-blue-500 hover:text-blue-700 dark:text-blue-300">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search to add members..."
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
              {users.map((user) => {
                const isSelected = selectedUsers.some((u) => u.id === user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user)}
                    className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name)}&background=3b82f6&color=fff`}
                        alt={user.display_name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{user.display_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.phone_number}</div>
                      </div>
                    </div>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                      {isSelected && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <button
                onClick={() => setStep(2)}
                disabled={selectedUsers.length === 0}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col p-6">
            <div className="mb-8 flex flex-col items-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full border-b-2 border-gray-300 dark:border-gray-600 bg-transparent px-2 py-2 text-center text-xl font-medium focus:border-blue-600 focus:outline-none"
                autoFocus
              />
            </div>
            
            <div className="mt-auto">
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
