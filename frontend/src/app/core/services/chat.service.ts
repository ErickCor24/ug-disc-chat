import { Injectable, inject, signal } from '@angular/core';

import { environment } from '../../../environments/environment';
import { ConnectedUser, Message, WsEvent } from '../models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly authService = inject(AuthService);

  // ── Estado reactivo ────────────────────────────────────────────────────
  readonly messages = signal<Message[]>([]);
  readonly typingUsers = signal<string[]>([]);
  readonly connected = signal(false);
  readonly connectedUsers = signal<ConnectedUser[]>([]);

  // ── Estado interno ─────────────────────────────────────────────────────
  private ws: WebSocket | null = null;

  /** Map: username → setTimeout handle para limpiar estado "escribiendo..." */
  private typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // ── Métodos públicos ───────────────────────────────────────────────────

  connect(channelId: string): void {
    // Cerrar conexión previa si existe
    this.disconnect();

    const token = this.authService.getToken();
    if (!token) return;

    const url = `${environment.wsUrl}/${channelId}?token=${token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.connected.set(true);
      this.messages.set([]); // Limpiar mensajes del canal anterior
      this.connectedUsers.set([]);
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data: WsEvent = JSON.parse(event.data);
        this._handleEvent(data);
      } catch {
        console.error('[ChatService] Error al parsear mensaje WS:', event.data);
      }
    };

    this.ws.onclose = () => {
      this.connected.set(false);
    };

    this.ws.onerror = (err) => {
      console.error('[ChatService] WebSocket error:', err);
      this.connected.set(false);
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected.set(false);
    this.typingUsers.set([]);
    this.connectedUsers.set([]);
    this._clearAllTypingTimers();
  }

  sendMessage(content: string): void {
    if (!content.trim() || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'message', content: content.trim() }));
  }

  sendTyping(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'typing', is_typing: true }));
  }

  // ── Manejo de eventos entrantes ────────────────────────────────────────

  private _handleEvent(event: WsEvent): void {
    switch (event.type) {
      case 'history_batch':
        this.messages.set(event.messages);
        break;

      case 'message':
        this.messages.update((msgs) => [
          ...msgs,
          {
            id: event.id,
            channel_id: event.channel_id,
            user_id: event.user_id,
            username: event.username,
            content: event.content,
            created_at: event.created_at,
          },
        ]);
        break;

      case 'typing':
        this._handleTyping(event.username, event.is_typing);
        break;

      case 'user_list':
        this.connectedUsers.set(event.users);
        break;

      case 'user_joined':
      case 'user_left':
        // Limpiar typing del usuario que se fue
        if (event.type === 'user_left') {
          this._clearTypingForUser(event.username);
        }
        break;
    }
  }

  /**
   * Gestiona el indicador "está escribiendo..." con debounce de 2 segundos.
   * Si el usuario deja de escribir, el estado se limpia automáticamente.
   */
  private _handleTyping(username: string, isTyping: boolean): void {
    if (!isTyping) {
      this._clearTypingForUser(username);
      return;
    }

    // Agregar al listado si no está ya
    this.typingUsers.update((users) =>
      users.includes(username) ? users : [...users, username],
    );

    // Resetear el temporizador de limpieza (debounce 2s)
    const existing = this.typingTimers.get(username);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this._clearTypingForUser(username);
    }, 2000);

    this.typingTimers.set(username, timer);
  }

  private _clearTypingForUser(username: string): void {
    const timer = this.typingTimers.get(username);
    if (timer) {
      clearTimeout(timer);
      this.typingTimers.delete(username);
    }
    this.typingUsers.update((users) => users.filter((u) => u !== username));
  }

  private _clearAllTypingTimers(): void {
    this.typingTimers.forEach((timer) => clearTimeout(timer));
    this.typingTimers.clear();
  }
}
