// ============================================================
//  types/index.ts
//  --------------
//  TypeScript types for the Signal clone frontend.
//
//  These types mirror the backend Pydantic schemas to ensure
//  type safety between frontend and backend.
// ============================================================

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface User {
  id: number;
  phone_number: string;
  display_name: string;
  avatar_url: string | null;
  is_online: boolean;
  last_seen: string | null;
}

export interface Participant {
  user_id: number;
  display_name: string;
  avatar_url: string | null;
  is_admin: boolean;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string | null;
  content: string;
  timestamp: string;
  status: MessageStatus;
}

export interface Conversation {
  id: number;
  is_group: boolean;
  name: string | null;
  created_at: string;
  participants: Participant[];
  last_message: Message | null;
  unread_count: number;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface WebSocketMessage {
  type: 'chat' | 'typing' | 'status_update' | 'view_conversation';
  data: Record<string, unknown>;
}

export interface TypingIndicator {
  conversation_id: number;
  user_id: number;
  user_name: string | null;
  is_typing: boolean;
}
