// ============================================================
//  store/appStore.ts
//  -----------------
//  Zustand store for global application state.
//
//  WHAT THIS STORES
//  ----------------
//  - currentUser: The logged-in user
//  - token: Auth token for API calls
//  - conversations: List of user's conversations
//  - activeConversation: Currently selected conversation
//  - messages: Messages for the active conversation
//  - WebSocket connection status
//  - Typing indicators from other users
//
//  WHY ZUSTAND?
//  ------------
//  - Simpler than Redux (no boilerplate)
//  - Built-in TypeScript support
//  - Works great with React hooks
//  - Persisted to localStorage for session recovery
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Conversation, Message, TypingIndicator } from '@/types';

interface AppState {
  // Auth state
  currentUser: User | null;
  token: string | null;
  
  // Conversation state
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Record<number, Message[]>;
  
  // WebSocket state
  isConnected: boolean;
  typingUsers: Record<number, TypingIndicator[]>;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversationId: (id: number | null) => void;
  addConversation: (conversation: Conversation) => void;
  
  setMessages: (conversationId: number, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: number, status: string) => void;
  
  setConnected: (connected: boolean) => void;
  setTyping: (conversationId: number, typing: TypingIndicator) => void;
  clearTyping: (conversationId: number, userId: number) => void;
  updateUserPresence: (userId: number, isOnline: boolean, lastSeen: string) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      token: null,
      conversations: [],
      activeConversationId: null,
      messages: {},
      isConnected: false,
      typingUsers: {},
      isLoading: false,
      error: null,
      
      // Auth actions
      setUser: (user) => set({ currentUser: user }),
      setToken: (token) => set({ token }),
      
      logout: () => set({
        currentUser: null,
        token: null,
        conversations: [],
        activeConversationId: null,
        messages: {},
        isConnected: false,
        typingUsers: {},
      }),
      
      // Conversation actions
      setConversations: (conversations) => set({ conversations }),
      
      setActiveConversationId: (id) => set((state) => ({ 
        activeConversationId: id,
        conversations: state.conversations.map(c => 
          c.id === id ? { ...c, unread_count: 0 } : c
        )
      })),
      
      addConversation: (conversation) => set((state) => ({
        conversations: [conversation, ...state.conversations],
      })),
      
      // Message actions
      setMessages: (conversationId, messages) => set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: messages,
        },
      })),
      
      addMessage: (message) => set((state) => {
        const existingMessages = state.messages[message.conversation_id] || [];
        const messageExists = existingMessages.some(m => m.id === message.id);
        
        if (messageExists) {
          return state;
        }
        
        const updatedConversations = state.conversations.map(c => {
          if (c.id === message.conversation_id) {
            const isOwnMessage = message.sender_id === state.currentUser?.id;
            const isActive = c.id === state.activeConversationId;
            const newUnreadCount = (isOwnMessage || isActive) ? 0 : (c.unread_count || 0) + 1;
            
            return { ...c, last_message: message, unread_count: newUnreadCount };
          }
          return c;
        });
        
        updatedConversations.sort((a, b) => {
          const timeA = a.last_message ? new Date(a.last_message.timestamp).getTime() : new Date(a.created_at).getTime();
          const timeB = b.last_message ? new Date(b.last_message.timestamp).getTime() : new Date(b.created_at).getTime();
          return timeB - timeA;
        });
        
        return {
          messages: {
            ...state.messages,
            [message.conversation_id]: [...existingMessages, message],
          },
          conversations: updatedConversations,
        };
      }),
      
      updateMessageStatus: (messageId, status) => set((state) => {
        const updatedMessages: Record<number, Message[]> = {};
        
        for (const [convId, msgs] of Object.entries(state.messages)) {
          updatedMessages[parseInt(convId)] = msgs.map(m =>
            m.id === messageId ? { ...m, status: status as Message['status'] } : m
          );
        }
        
        return { messages: updatedMessages };
      }),
      
      // WebSocket actions
      setConnected: (connected) => set({ isConnected: connected }),
      
      setTyping: (conversationId, typing) => set((state) => {
        const existing = state.typingUsers[conversationId] || [];
        const filtered = existing.filter(t => t.user_id !== typing.user_id);
        return {
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: [...filtered, typing],
          },
        };
      }),
      
      clearTyping: (conversationId, userId) => set((state) => {
        const existing = state.typingUsers[conversationId] || [];
        return {
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: existing.filter(t => t.user_id !== userId),
          },
        };
      }),
      
      updateUserPresence: (userId, isOnline, lastSeen) => set((state) => {
        const updatedConversations = state.conversations.map((conv) => {
          const hasUser = conv.participants.some(p => p.user_id === userId);
          if (!hasUser) return conv;
          
          return {
            ...conv,
            participants: conv.participants.map(p => 
              p.user_id === userId ? { ...p, is_online: isOnline, last_seen: lastSeen } : p
            )
          };
        });
        
        return { conversations: updatedConversations };
      }),
      
      // UI actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'signal-clone-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        token: state.token,
      }),
    }
  )
);
