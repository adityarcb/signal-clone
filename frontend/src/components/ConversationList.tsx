'use client';

import { useAppStore } from '@/store/appStore';
import type { Conversation } from '@/types';
import { formatDistanceToNow } from '../utils/date';

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
  const { conversations, activeConversationId } = useAppStore();
  
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    if (conv.is_group && conv.name) {
      return conv.name.toLowerCase().includes(searchLower);
    }
    const participant = conv.participants[0];
    return participant?.display_name.toLowerCase().includes(searchLower);
  });
  
  const getConversationName = (conv: Conversation): string => {
    if (conv.is_group && conv.name) return conv.name;
    const otherParticipant = conv.participants.find((p) => p);
    return otherParticipant?.display_name || 'Unknown';
  };
  
  const getConversationAvatar = (conv: Conversation): string => {
    if (conv.is_group) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(conv.name || 'Group')}&background=6366f1&color=fff`;
    }
    const otherParticipant = conv.participants.find((p) => p);
    return otherParticipant?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.display_name || 'U')}&background=6366f1&color=fff`;
  };
  
  const getLastMessageTime = (conv: Conversation): string => {
    if (!conv.last_message) return '';
    return formatDistanceToNow(new Date(conv.last_message.timestamp));
  };
  
  const getLastMessagePreview = (conv: Conversation): string => {
    if (!conv.last_message) return 'No messages yet';
    const content = conv.last_message.content;
    return content.length > 40 ? content.substring(0, 40) + '...' : content;
  };
  
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-gray-200 p-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-full bg-gray-100 px-4 py-2 text-sm placeholder-gray-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <svg
            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
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
        {filteredConversations.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-gray-500">
            No conversations found
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50 ${
                activeConversationId === conv.id ? 'bg-blue-50' : ''
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
                  <span className="font-medium text-gray-900">
                    {getConversationName(conv)}
                  </span>
                  {conv.last_message && (
                    <span className="text-xs text-gray-500">
                      {getLastMessageTime(conv)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="truncate text-sm text-gray-500">
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
      </div>
    </div>
  );
}
