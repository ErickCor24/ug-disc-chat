import { Component, HostListener, OnDestroy, OnInit, inject, signal } from '@angular/core';

import { Channel } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { ChannelService } from '../../../core/services/channel.service';
import { ChatService } from '../../../core/services/chat.service';
import { IconComponent } from '../../../shared/ui/icon.component';
import { LogoComponent } from '../../../shared/ui/logo.component';
import { ChannelListComponent } from '../channel-list/channel-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { MessageListComponent } from '../message-list/message-list.component';
import { UserListComponent } from '../user-list/user-list.component';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [
    ChannelListComponent,
    MessageListComponent,
    MessageInputComponent,
    UserListComponent,
    IconComponent,
    LogoComponent,
  ],
  template: `
    <button class="hamburger-btn"
      (click)="toggleDrawer()"
      [attr.aria-label]="sidebarOpen() ? 'Cerrar menú' : 'Abrir menú'"
      [attr.aria-expanded]="sidebarOpen()">
      <app-icon class="hamburger-icon" name="menu" />
    </button>

    @if (sidebarOpen()) {
      <div class="drawer-backdrop" (click)="closeSidebar()"></div>
    }

    <!-- Sidebar con lista de canales -->
    <aside class="sidebar" [class.open]="sidebarOpen()">
      <div class="sidebar-header">
        <div class="brand-name">
          <app-logo class="brand-logo" />
          <h2>ChatApp</h2>
        </div>
        <button class="logout-btn" (click)="logout()" aria-label="Cerrar sesión">
          <app-icon class="logout-icon" name="logout" />
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

      <app-user-list [users]="chatService.connectedUsers()" />
    </aside>

    <!-- Área principal del chat -->
    <main class="chat-area">
      @if (channelService.selectedChannel(); as channel) {
        <header class="chat-header">
          <span class="channel-hash">#</span>
          <h3>{{ channel.name }}</h3>
          @if (channel.description) {
            <span class="channel-desc">{{ channel.description }}</span>
          }
        </header>

        <div class="chat-body">
          <app-message-list [messages]="chatService.messages()" />
          <app-message-input [channelName]="channel.name" />
        </div>
      } @else {
        <div class="no-channel">
          <app-icon class="icon" name="chat-bubble" />
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

  readonly sidebarOpen = signal(false);

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
    this.closeSidebar();
  }

  logout(): void {
    this.chatService.disconnect();
    this.authService.logout();
  }

  toggleDrawer(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.sidebarOpen()) {
      this.closeSidebar();
    }
  }
}
