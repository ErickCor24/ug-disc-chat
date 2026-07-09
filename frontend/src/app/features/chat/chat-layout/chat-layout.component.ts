import { Component, OnDestroy, OnInit, inject } from '@angular/core';

import { Channel } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { ChannelService } from '../../../core/services/channel.service';
import { ChatService } from '../../../core/services/chat.service';
import { ChannelListComponent } from '../channel-list/channel-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { MessageListComponent } from '../message-list/message-list.component';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [ChannelListComponent, MessageListComponent, MessageInputComponent],
  template: `
    <!-- Sidebar con lista de canales -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>💬 ChatApp</h2>
        <button class="logout-btn" (click)="logout()" aria-label="Cerrar sesión">
          Salir
        </button>
      </div>

      <div class="sidebar-channels">
        <app-channel-list
          [channels]="channelService.channels()"
          [selectedId]="channelService.selectedChannel()?.id ?? null"
          (select)="onChannelSelect($event)"
        />
      </div>
    </aside>

    <!-- Área principal del chat -->
    <main class="chat-area">
      @if (channelService.selectedChannel(); as channel) {
        <header class="chat-header">
          <span class="channel-hash">#</span>
          <h3>{{ channel.name }}</h3>
        </header>

        <div class="chat-body">
          <app-message-list [messages]="chatService.messages()" />
          <app-message-input [channelName]="channel.name" />
        </div>
      } @else {
        <div class="no-channel">
          <span class="icon">💬</span>
          <p>Selecciona un canal para empezar a chatear</p>
        </div>
      }
    </main>
  `,
  styleUrl: 'chat-layout.component.scss',
})
export class ChatLayoutComponent implements OnInit, OnDestroy {
  readonly channelService = inject(ChannelService);
  readonly chatService = inject(ChatService);

  private readonly authService = inject(AuthService);

  ngOnInit(): void {
    // Cargar canales al iniciar la vista
    this.channelService.loadChannels().subscribe({
      error: (err) => console.error('[ChatLayout] Error cargando canales:', err),
    });
  }

  ngOnDestroy(): void {
    // Cerrar WebSocket limpiamente al salir del componente
    this.chatService.disconnect();
  }

  onChannelSelect(channel: Channel): void {
    // Desconectar del canal anterior y conectar al nuevo
    this.chatService.disconnect();
    this.channelService.selectChannel(channel);
    this.chatService.connect(channel.id);
  }

  logout(): void {
    this.chatService.disconnect();
    this.authService.logout();
  }
}
