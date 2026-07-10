import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ChatService } from '../../../core/services/chat.service';
import { IconComponent } from '../../../shared/ui/icon.component';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [FormsModule, IconComponent],
  template: `
    <!-- Indicador "está escribiendo..." -->
    @if (typingUsers().length > 0) {
      <div class="typing-indicator" aria-live="polite">
        <span class="dots">
          <span></span><span></span><span></span>
        </span>
        <span class="typing-text">{{ typingLabel() }}</span>
      </div>
    }

    <form class="input-area" (ngSubmit)="submit()">
      <input
        type="text"
        class="message-input"
        [(ngModel)]="messageText"
        name="message"
        [placeholder]="'Escribe en #' + channelName + '…'"
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
        <app-icon class="send-icon" name="send" />
      </button>
    </form>
  `,
  styles: [`
    :host {
      display: block;
      flex-shrink: 0;
    }

    .typing-indicator {
      align-items: center;
      color: var(--color-text-muted);
      display: flex;
      font-size: 0.82rem;
      gap: 0.5rem;
      min-height: 1.5rem;
      padding: 0.2rem 1.5rem 0;

      .dots {
        display: flex;
        gap: 3px;

        span {
          animation: bounce 1.2s infinite ease-in-out;
          background: var(--color-text-light);
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
      display: flex;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem 1rem;
      background: rgba(255,255,255,0.55);
      backdrop-filter: var(--blur);
      -webkit-backdrop-filter: var(--blur);
      border-top: 1px solid var(--color-border);
    }

    .message-input {
      background: rgba(255,255,255,0.75);
      border: 1.5px solid var(--color-border-strong);
      border-radius: 22px;
      color: var(--color-text);
      flex: 1;
      font-family: var(--font);
      font-size: 0.97rem;
      outline: none;
      padding: 0.7rem 1.1rem;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      box-shadow: var(--shadow-sm);

      &::placeholder { color: var(--color-text-light); }

      &:focus {
        background: rgba(255,255,255,0.92);
        border-color: var(--color-accent);
        box-shadow: 0 0 0 3px var(--color-accent-soft), var(--shadow-sm);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .send-btn {
      align-items: center;
      background: var(--color-accent);
      border: none;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(99,102,241,0.35);
      color: #fff;
      cursor: pointer;
      display: flex;
      height: 42px;
      justify-content: center;
      transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
      width: 42px;
      flex-shrink: 0;

      .send-icon {
        font-size: 1.15rem;
      }

      &:hover:not(:disabled) {
        background: var(--color-accent-hover);
        box-shadow: 0 6px 18px rgba(99,102,241,0.45);
        transform: translateY(-1px) scale(1.05);
      }

      &:active:not(:disabled) {
        transform: translateY(0) scale(0.97);
      }

      &:disabled {
        background: var(--color-text-light);
        box-shadow: none;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }
  `],
})
export class MessageInputComponent {
  private readonly chatService = inject(ChatService);

  @Input() channelName = '';
  @Output() messageSent = new EventEmitter<void>();

  messageText = '';

  /** Evita saturar el socket: emite "escribiendo..." como máximo cada 1.5s. */
  private _typingThrottled = false;
  private static readonly TYPING_THROTTLE_MS = 1500;

  readonly connected = this.chatService.connected;
  readonly typingUsers = this.chatService.typingUsers;

  readonly typingLabel = () => {
    const users = this.typingUsers();
    if (users.length === 1) return `${users[0]} está escribiendo...`;
    if (users.length === 2) return `${users[0]} y ${users[1]} están escribiendo...`;
    return 'Varios usuarios están escribiendo...';
  };

  onInput(): void {
    if (!this.messageText.trim() || this._typingThrottled) return;

    this.chatService.sendTyping();
    this._typingThrottled = true;
    setTimeout(() => {
      this._typingThrottled = false;
    }, MessageInputComponent.TYPING_THROTTLE_MS);
  }

  submit(): void {
    const text = this.messageText.trim();
    if (!text) return;
    this.chatService.sendMessage(text);
    this.messageText = '';
    this.messageSent.emit();
  }
}
