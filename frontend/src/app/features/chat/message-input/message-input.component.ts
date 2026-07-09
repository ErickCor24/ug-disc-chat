import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ChatService } from '../../../core/services/chat.service';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <!-- Banner "está escribiendo..." -->
    @if (typingUsers().length > 0) {
      <div class="typing-indicator" aria-live="polite">
        <span class="dots">
          <span></span><span></span><span></span>
        </span>
        <span class="typing-text">
          {{ typingLabel() }}
        </span>
      </div>
    }

    <form class="input-area" (ngSubmit)="submit()">
      <input
        type="text"
        class="message-input"
        [(ngModel)]="messageText"
        name="message"
        [placeholder]="'Mensaje en #' + channelName"
        [disabled]="!connected()"
        (input)="onInput()"
        (keydown.enter)="$event.preventDefault(); submit()"
        autocomplete="off"
        aria-label="Escribir mensaje"
        maxlength="2000"
      />
      <button
        type="submit"
        class="send-btn"
        [disabled]="!messageText.trim() || !connected()"
        aria-label="Enviar mensaje"
      >
        ➤
      </button>
    </form>
  `,
  styles: [`
    :host {
      display: block;
    }

    .typing-indicator {
      align-items: center;
      color: #8899aa;
      display: flex;
      font-size: 0.78rem;
      gap: 0.5rem;
      min-height: 1.5rem;
      padding: 0.25rem 1.25rem;

      .dots {
        display: flex;
        gap: 3px;

        span {
          animation: bounce 1.2s infinite ease-in-out;
          background: #8899aa;
          border-radius: 50%;
          display: block;
          height: 5px;
          width: 5px;

          &:nth-child(2) { animation-delay: 0.2s; }
          &:nth-child(3) { animation-delay: 0.4s; }
        }
      }
    }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1.2); opacity: 1; }
    }

    .input-area {
      align-items: center;
      background: #1f2937;
      border-top: 1px solid #374151;
      display: flex;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
    }

    .message-input {
      background: #111827;
      border: 1px solid #374151;
      border-radius: 8px;
      color: #e0e0e0;
      flex: 1;
      font-size: 0.9rem;
      outline: none;
      padding: 0.65rem 1rem;
      transition: border-color 0.2s;

      &::placeholder { color: #4a5568; }
      &:focus { border-color: #5865f2; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .send-btn {
      background: #5865f2;
      border: none;
      border-radius: 8px;
      color: #fff;
      cursor: pointer;
      font-size: 1rem;
      height: 40px;
      transition: background 0.2s, opacity 0.2s;
      width: 40px;

      &:hover:not(:disabled) { background: #4752c4; }
      &:disabled { cursor: not-allowed; opacity: 0.5; }
    }
  `],
})
export class MessageInputComponent {
  private readonly chatService = inject(ChatService);

  @Input() channelName = '';
  @Output() messageSent = new EventEmitter<void>();

  messageText = '';

  readonly connected = this.chatService.connected;
  readonly typingUsers = this.chatService.typingUsers;

  readonly typingLabel = () => {
    const users = this.typingUsers();
    if (users.length === 1) return `${users[0]} está escribiendo...`;
    if (users.length === 2) return `${users[0]} y ${users[1]} están escribiendo...`;
    return 'Varios usuarios están escribiendo...';
  };

  onInput(): void {
    if (this.messageText.trim()) {
      this.chatService.sendTyping();
    }
  }

  submit(): void {
    const text = this.messageText.trim();
    if (!text) return;

    this.chatService.sendMessage(text);
    this.messageText = '';
    this.messageSent.emit();
  }
}
