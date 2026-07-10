// ── Modelos de dominio compartidos en toda la app ─────────────────────────

export interface User {
  user_id: string;
  username: string;
}

export interface ConnectedUser {
  user_id: string;
  username: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  user_id: string | null;
  username: string | null;
  content: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  username: string;
}

// ── Tipos de eventos WebSocket ─────────────────────────────────────────────

export type WsEventType =
  | 'history_batch'
  | 'message'
  | 'typing'
  | 'user_joined'
  | 'user_left'
  | 'user_list';

export interface WsHistoryBatch {
  type: 'history_batch';
  messages: Message[];
}

export interface WsMessage {
  type: 'message';
  id: string;
  channel_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

export interface WsTyping {
  type: 'typing';
  user_id: string;
  username: string;
  is_typing: boolean;
}

export interface WsUserEvent {
  type: 'user_joined' | 'user_left';
  user_id: string;
  username: string;
}

export interface WsUserList {
  type: 'user_list';
  users: ConnectedUser[];
}

export type WsEvent = WsHistoryBatch | WsMessage | WsTyping | WsUserEvent | WsUserList;
