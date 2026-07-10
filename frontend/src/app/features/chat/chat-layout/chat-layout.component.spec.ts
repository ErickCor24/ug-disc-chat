import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, EventEmitter, Input, Output, input, signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Channel, Message } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { ChannelService } from '../../../core/services/channel.service';
import { ChatService } from '../../../core/services/chat.service';
import { IconComponent } from '../../../shared/ui/icon.component';
import { LogoComponent } from '../../../shared/ui/logo.component';
import { ChatLayoutComponent } from './chat-layout.component';

@Component({
  selector: 'app-channel-list',
  standalone: true,
  template: '',
})
class StubChannelListComponent {
  @Input() channels: Channel[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Channel>();
}

@Component({
  selector: 'app-message-list',
  standalone: true,
  template: '',
})
class StubMessageListComponent {
  readonly messages = input<Message[]>([]);
}

@Component({
  selector: 'app-message-input',
  standalone: true,
  template: '',
})
class StubMessageInputComponent {
  @Input() channelName = '';
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  template: '',
})
class StubUserListComponent {
  readonly users = input<any[]>([]);
}

describe('ChatLayoutComponent', () => {
  let component: ChatLayoutComponent;
  let fixture: ComponentFixture<ChatLayoutComponent>;
  let mockChannelService: any;
  let mockChatService: any;
  let mockAuthService: any;

  beforeEach(async () => {
    mockChannelService = {
      channels: vi.fn().mockReturnValue(signal([])),
      selectedChannel: vi.fn().mockReturnValue(signal(null)),
      loadChannels: vi.fn().mockReturnValue(of([])),
      selectChannel: vi.fn(),
    };

    mockChatService = {
      connectedUsers: vi.fn().mockReturnValue(signal([])),
      messages: vi.fn().mockReturnValue(signal([])),
      connected: vi.fn().mockReturnValue(signal(false)),
      disconnect: vi.fn(),
      connect: vi.fn(),
    };

    mockAuthService = {
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [StubChannelListComponent, StubMessageListComponent, StubMessageInputComponent, StubUserListComponent],
      providers: [
        { provide: ChannelService, useValue: mockChannelService },
        { provide: ChatService, useValue: mockChatService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
      .overrideComponent(ChatLayoutComponent, {
        set: {
          imports: [
            StubChannelListComponent,
            StubMessageListComponent,
            StubMessageInputComponent,
            StubUserListComponent,
            IconComponent,
            LogoComponent,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ChatLayoutComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call channelService.loadChannels on init', () => {
      fixture.detectChanges();
      expect(mockChannelService.loadChannels).toHaveBeenCalled();
    });
  });

  describe('Drawer toggle behavior', () => {
    it('should initialize sidebarOpen as false', () => {
      expect(component.sidebarOpen()).toBe(false);
    });

    it('toggleDrawer should flip sidebarOpen from false to true', () => {
      component.sidebarOpen.set(false);
      component.toggleDrawer();
      expect(component.sidebarOpen()).toBe(true);
    });

    it('toggleDrawer should flip sidebarOpen from true to false', () => {
      component.sidebarOpen.set(true);
      component.toggleDrawer();
      expect(component.sidebarOpen()).toBe(false);
    });

    it('toggleDrawer should toggle multiple times correctly', () => {
      expect(component.sidebarOpen()).toBe(false);
      component.toggleDrawer();
      expect(component.sidebarOpen()).toBe(true);
      component.toggleDrawer();
      expect(component.sidebarOpen()).toBe(false);
      component.toggleDrawer();
      expect(component.sidebarOpen()).toBe(true);
    });
  });

  describe('closeSidebar', () => {
    it('should set sidebarOpen to false', () => {
      component.sidebarOpen.set(true);
      component.closeSidebar();
      expect(component.sidebarOpen()).toBe(false);
    });

    it('should set sidebarOpen to false when already false', () => {
      component.sidebarOpen.set(false);
      component.closeSidebar();
      expect(component.sidebarOpen()).toBe(false);
    });
  });

  describe('Escape key listener', () => {
    it('should close sidebar on Escape when sidebar is open', () => {
      component.sidebarOpen.set(true);
      component.onEscapeKey();
      expect(component.sidebarOpen()).toBe(false);
    });

    it('should not affect sidebar when Escape pressed and sidebar closed', () => {
      component.sidebarOpen.set(false);
      component.onEscapeKey();
      expect(component.sidebarOpen()).toBe(false);
    });
  });

  describe('onChannelSelect', () => {
    it('should call disconnect, selectChannel, connect, and closeSidebar in order', () => {
      const channel: Channel = {
        id: 'ch-1',
        name: 'general',
        description: 'General channel',
        created_at: '2025-01-01T00:00:00Z',
      };

      component.sidebarOpen.set(true);
      component.onChannelSelect(channel);

      expect(mockChatService.disconnect).toHaveBeenCalled();
      expect(mockChannelService.selectChannel).toHaveBeenCalledWith(channel);
      expect(mockChatService.connect).toHaveBeenCalledWith('ch-1');
      expect(component.sidebarOpen()).toBe(false);
    });

    it('should call methods with correct channel ID', () => {
      const channel: Channel = {
        id: 'ch-custom',
        name: 'special',
        description: null,
        created_at: '2025-01-01T00:00:00Z',
      };

      component.onChannelSelect(channel);

      expect(mockChatService.connect).toHaveBeenCalledWith('ch-custom');
      expect(mockChannelService.selectChannel).toHaveBeenCalledWith(channel);
    });

    it('should close sidebar after channel selection', () => {
      const channel: Channel = {
        id: 'ch-1',
        name: 'general',
        description: 'General channel',
        created_at: '2025-01-01T00:00:00Z',
      };

      component.sidebarOpen.set(true);
      component.onChannelSelect(channel);

      expect(component.sidebarOpen()).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    it('should call chatService.disconnect on destroy', () => {
      fixture.detectChanges();
      fixture.destroy();
      expect(mockChatService.disconnect).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should call chatService.disconnect and authService.logout', () => {
      component.logout();
      expect(mockChatService.disconnect).toHaveBeenCalled();
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });
});
