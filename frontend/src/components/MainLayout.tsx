'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { api } from '@/lib/api';
import { ConversationList } from './ConversationList';
import { ChatArea } from './ChatArea';
import { CallsPlaceholder } from './CallsPlaceholder';
import { SettingsPlaceholder } from './SettingsPlaceholder';

type Tab = 'chats' | 'calls' | 'settings';

export function MainLayout() {
  const {
    currentUser,
    token,
    conversations,
    setConversations,
    setActiveConversationId,
  } = useAppStore();
  
  const { isConnected } = useWebSocket();
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  
  useEffect(() => {
    const loadConversations = async () => {
      if (!token) return;
      
      try {
        const convs = await api.getConversations(token);
        setConversations(convs);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      }
    };
    
    loadConversations();
  }, [token, setConversations]);
  
  if (!currentUser || !token) {
    return null;
  }
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'chats':
        return (
          <div className="flex-1 flex flex-col">
            <ChatArea />
          </div>
        );
      case 'calls':
        return <CallsPlaceholder />;
      case 'settings':
        return <SettingsPlaceholder />;
      default:
        return <ChatArea />;
    }
  };
  
  return (
    <div className="flex h-screen w-screen bg-gray-50">
      <aside className="hidden lg:flex lg:w-96 flex-col border-r border-gray-200 bg-white">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'chats'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Chats
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'calls'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Calls
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chats' && (
            <ConversationList
              onSelectConversation={setActiveConversationId}
              searchQuery=""
              onSearchChange={() => {}}
            />
          )}
          {activeTab === 'calls' && (
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-sm text-gray-500 text-center pt-8">Call history will appear here</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto">
              <p className="text-sm text-gray-500 text-center pt-8">Settings shortcuts</p>
            </div>
          )}
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col">
        {renderTabContent()}
      </main>
      
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-lg">
        <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
}