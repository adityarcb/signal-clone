// ============================================================
//  lib/api.ts
//  ----------
//  API client for communicating with the FastAPI backend.
//
//  This module provides typed functions for all API endpoints.
//  It automatically includes the auth token from Zustand store.
// ============================================================

import type { User, Conversation, ConversationDetail, Message, LoginResponse } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  // Auth
  async login(phoneNumber: string): Promise<LoginResponse> {
    return fetchAPI<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
  },
  
  async register(phoneNumber: string): Promise<{ message: string }> {
    return fetchAPI<{ message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
  },
  
  async verifyOtp(phoneNumber: string, code: string): Promise<LoginResponse> {
    return fetchAPI<LoginResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, code }),
    });
  },
  
  async updateProfile(displayName: string, avatarUrl: string | null, token: string): Promise<User> {
    return fetchAPI<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ display_name: displayName, avatar_url: avatarUrl }),
    }, token);
  },
  
  async getMe(token: string): Promise<User> {
    return fetchAPI<User>('/auth/me', undefined, token);
  },
  
  // Conversations
  async getConversations(token: string): Promise<Conversation[]> {
    return fetchAPI<Conversation[]>('/conversations', undefined, token);
  },
  
  async getConversation(conversationId: number, token: string): Promise<ConversationDetail> {
    return fetchAPI<ConversationDetail>(`/conversations/${conversationId}`, undefined, token);
  },
  
  async getMessages(conversationId: number, token: string, limit = 50, offset = 0): Promise<Message[]> {
    return fetchAPI<Message[]>(
      `/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
      undefined,
      token
    );
  },
  
  // Users
  async searchUsers(query: string, token: string): Promise<User[]> {
    return fetchAPI<User[]>(`/users/search?q=${encodeURIComponent(query)}`, undefined, token);
  },
  
  async getUser(userId: number, token: string): Promise<User> {
    return fetchAPI<User>(`/users/${userId}`, undefined, token);
  },
  
  // Groups
  async createGroup(name: string, participantIds: number[], token: string): Promise<Conversation> {
    return fetchAPI<Conversation>('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, participant_ids: participantIds }),
    }, token);
  },
  
  async createDirectConversation(targetUserId: number, token: string): Promise<ConversationDetail> {
    return fetchAPI<ConversationDetail>('/conversations/direct', {
      method: 'POST',
      body: JSON.stringify({ target_user_id: targetUserId }),
    }, token);
  },
  
  async addGroupMember(conversationId: number, userId: number, token: string): Promise<void> {
    await fetchAPI(`/groups/${conversationId}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }, token);
  },
  
  async removeGroupMember(conversationId: number, userId: number, token: string): Promise<void> {
    await fetchAPI(`/groups/${conversationId}/members/${userId}`, {
      method: 'DELETE',
    }, token);
  },
  
  async leaveGroup(conversationId: number, token: string): Promise<void> {
    await fetchAPI(`/groups/${conversationId}/leave`, {
      method: 'POST',
    }, token);
  },
};
