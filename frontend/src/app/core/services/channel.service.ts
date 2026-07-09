import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Channel } from '../models';

@Injectable({ providedIn: 'root' })
export class ChannelService {
  private readonly http = inject(HttpClient);

  // ── Estado reactivo ────────────────────────────────────────────────────
  readonly channels = signal<Channel[]>([]);
  readonly selectedChannel = signal<Channel | null>(null);

  // ── Métodos públicos ───────────────────────────────────────────────────

  loadChannels() {
    return this.http
      .get<Channel[]>(`${environment.apiUrl}/channels/`)
      .pipe(tap((channels) => this.channels.set(channels)));
  }

  selectChannel(channel: Channel): void {
    this.selectedChannel.set(channel);
  }
}
