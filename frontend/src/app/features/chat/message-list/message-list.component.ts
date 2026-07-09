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

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [DateFormatPipe],
  template: `
    <div class="message-list" #scrollContainer>
      @if (messages().length === 0) {
        <div class="empty-state">
          <p>No hay mensajes aún. ¡Sé el primero en escribir!</p>
        </div>
      }

      @for (msg of messages(); track msg.id) {
        <div class="message" [class.own]="msg.user_id === currentUserId()">
          <div class="message-meta">
            <span class="username">{{ msg.username ?? 'Usuario eliminado' }}</span>
            <span class="timestamp">{{ msg.created_at | dateFormat }}</span>
          </div>
          <div class="message-content">{{ msg.content }}</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .message-list {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      scroll-behavior: smooth;

      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-thumb {
        background: #334;
        border-radius: 3px;
      }
    }

    .empty-state {
      color: #556;
      font-size: 0.875rem;
      margin: auto;
      text-align: center;
    }

    .message {
      max-width: 70%;
      padding: 0.5rem 0.875rem;
      border-radius: 12px;
      background: #1f2937;
      align-self: flex-start;

      &.own {
        align-self: flex-end;
        background: #2d3b8e;
      }

      .message-meta {
        display: flex;
        gap: 0.5rem;
        align-items: baseline;
        margin-bottom: 0.2rem;
      }

      .username {
        color: #5865f2;
        font-size: 0.78rem;
        font-weight: 600;
      }

      .timestamp {
        color: #4a5568;
        font-size: 0.7rem;
      }

      .message-content {
        color: #d1d5db;
        font-size: 0.9rem;
        line-height: 1.4;
        word-break: break-word;
      }
    }
  `],
})
export class MessageListComponent implements AfterViewChecked {
  private readonly authService = inject(AuthService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLDivElement>;

  /** Signal input — recibe los mensajes como signal desde el padre. */
  readonly messages = input<Message[]>([]);

  currentUserId(): string | null {
    return this.authService.currentUser()?.user_id ?? null;
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
