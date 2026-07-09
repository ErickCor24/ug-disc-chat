import {
  AfterViewChecked,
  Component,
  ElementRef,
  ViewChild,
  inject,
  input,
} from '@angular/core';

import { Message } from '../../../core/models';
import { DateFormatPipe } from '../../../core/pipes/date-format.pipe';
import { AuthService } from '../../../core/services/auth.service';

/** Paleta de 8 colores para asignar a usuarios por hash del username */
const USER_COLORS = [
  '#e05c5c', // rojo
  '#d97706', // ámbar
  '#059669', // esmeralda
  '#7c3aed', // violeta
  '#db2777', // rosa
  '#0891b2', // cian
  '#65a30d', // lima
  '#c2410c', // naranja
];

/** Fondo suave correspondiente a cada color */
const USER_BG_COLORS = [
  'rgba(224,92,92,0.10)',
  'rgba(217,119,6,0.10)',
  'rgba(5,150,105,0.10)',
  'rgba(124,58,237,0.10)',
  'rgba(219,39,119,0.10)',
  'rgba(8,145,178,0.10)',
  'rgba(101,163,13,0.10)',
  'rgba(194,65,12,0.10)',
];

function hashUsername(username: string): number {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return hash % USER_COLORS.length;
}

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [DateFormatPipe],
  template: `
    <div class="message-list" #scrollContainer>
      @if (messages().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">🫧</span>
          <p>No hay mensajes aún.</p>
          <span class="empty-sub">¡Sé el primero en escribir!</span>
        </div>
      }

      @for (msg of messages(); track msg.id) {
        <div class="message-row" [class.own]="msg.user_id === currentUserId()">
          <!-- Avatar -->
          @if (msg.user_id !== currentUserId()) {
            <div class="avatar"
              [style.background]="getBgColor(msg.username)"
              [style.color]="getColor(msg.username)"
              [attr.aria-label]="msg.username ?? 'Usuario'">
              {{ getInitial(msg.username) }}
            </div>
          }

          <div class="bubble-group">
            <!-- Meta (solo mensajes de otros) -->
            @if (msg.user_id !== currentUserId()) {
              <div class="message-meta">
                <span class="username" [style.color]="getColor(msg.username)">
                  {{ msg.username ?? 'Usuario eliminado' }}
                </span>
                <span class="timestamp">{{ msg.created_at | dateFormat }}</span>
              </div>
            }

            <!-- Burbuja -->
            <div class="bubble" [class.own]="msg.user_id === currentUserId()">
              <span class="message-content">{{ msg.content }}</span>
              @if (msg.user_id === currentUserId()) {
                <span class="timestamp own-time">{{ msg.created_at | dateFormat }}</span>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .message-list {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      scroll-behavior: smooth;

      &::-webkit-scrollbar { width: 5px; }
      &::-webkit-scrollbar-thumb {
        background: rgba(0,0,0,0.12);
        border-radius: 99px;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      margin: auto;
      color: var(--color-text-muted);
      text-align: center;

      .empty-icon { font-size: 2.5rem; }
      p { margin: 0; font-size: 1rem; font-weight: 500; }
      .empty-sub { font-size: 0.875rem; color: var(--color-text-light); }
    }

    .message-row {
      display: flex;
      align-items: flex-end;
      gap: 0.6rem;

      &.own {
        flex-direction: row-reverse;
      }
    }

    /* Avatar circular con inicial */
    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
      border: 1.5px solid rgba(255,255,255,0.7);
    }

    .bubble-group {
      display: flex;
      flex-direction: column;
      max-width: 68%;
      gap: 0.2rem;
    }

    .message-meta {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      padding-left: 0.25rem;
    }

    .username {
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.01em;
    }

    .timestamp {
      color: var(--color-text-light);
      font-size: 0.72rem;
    }

    /* Burbuja de mensaje */
    .bubble {
      background: var(--color-bubble-other);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.6);
      border-radius: 18px 18px 18px 4px;
      box-shadow: var(--shadow-sm);
      color: var(--color-bubble-other-text);
      padding: 0.65rem 1rem;
      position: relative;

      &.own {
        background: var(--color-bubble-own);
        border-color: transparent;
        border-radius: 18px 18px 4px 18px;
        color: var(--color-bubble-own-text);
        box-shadow: 0 4px 14px rgba(99,102,241,0.30);
        display: flex;
        align-items: flex-end;
        gap: 0.6rem;
      }
    }

    .message-content {
      font-size: 0.97rem;
      line-height: 1.45;
      word-break: break-word;
    }

    .own-time {
      color: rgba(255,255,255,0.65);
      font-size: 0.7rem;
      white-space: nowrap;
      flex-shrink: 0;
    }
  `],
})
export class MessageListComponent implements AfterViewChecked {
  private readonly authService = inject(AuthService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLDivElement>;

  readonly messages = input<Message[]>([]);

  currentUserId(): string | null {
    return this.authService.currentUser()?.user_id ?? null;
  }

  getColor(username: string | null): string {
    if (!username) return USER_COLORS[0];
    return USER_COLORS[hashUsername(username)];
  }

  getBgColor(username: string | null): string {
    if (!username) return USER_BG_COLORS[0];
    return USER_BG_COLORS[hashUsername(username)];
  }

  getInitial(username: string | null): string {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  }

  ngAfterViewChecked(): void {
    this._scrollToBottom();
  }

  private _scrollToBottom(): void {
    try {
      const el = this.scrollContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {
      // Silenciar si el elemento no está disponible aún
    }
  }
}
