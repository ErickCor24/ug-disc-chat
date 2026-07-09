import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Channel } from '../../../core/models';

@Component({
  selector: 'app-channel-list',
  standalone: true,
  template: `
    <ul class="channel-list" role="list">
      <li class="section-label">
        <span>Canales</span>
        <span class="count">{{ channels.length }}</span>
      </li>
      @for (channel of channels; track channel.id) {
        <li
          class="channel-item"
          [class.active]="selectedId === channel.id"
          (click)="select.emit(channel)"
          (keydown.enter)="select.emit(channel)"
          tabindex="0"
          role="button"
          [attr.aria-label]="'Canal ' + channel.name"
          [attr.aria-current]="selectedId === channel.id ? 'page' : null"
        >
          <span class="channel-icon">#</span>
          <span class="channel-name">{{ channel.name }}</span>
          @if (selectedId === channel.id) {
            <span class="active-dot"></span>
          }
        </li>
      }
    </ul>
  `,
  styles: [`
    .channel-list {
      list-style: none;
      margin: 0;
      padding: 0 0.5rem;
    }

    .section-label {
      align-items: center;
      color: var(--color-text-light);
      display: flex;
      font-size: 0.72rem;
      font-weight: 700;
      justify-content: space-between;
      letter-spacing: 0.07em;
      padding: 0.75rem 0.75rem 0.4rem;
      text-transform: uppercase;

      .count {
        background: var(--color-bg-alt);
        border-radius: 99px;
        font-size: 0.7rem;
        padding: 0.1rem 0.5rem;
      }
    }

    .channel-item {
      align-items: center;
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
      cursor: pointer;
      display: flex;
      font-size: 0.95rem;
      font-weight: 500;
      gap: 0.5rem;
      outline: none;
      padding: 0.55rem 0.75rem;
      transition: background 0.15s, color 0.15s, transform 0.1s;
      position: relative;

      &:hover,
      &:focus-visible {
        background: rgba(99, 102, 241, 0.07);
        color: var(--color-text);
        transform: translateX(2px);
      }

      &.active {
        background: var(--color-surface);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.7);
        box-shadow: var(--shadow-sm);
        color: var(--color-accent);
        font-weight: 600;
        transform: none;

        .channel-icon { color: var(--color-accent); }
      }

      .channel-icon {
        color: var(--color-text-light);
        font-size: 1rem;
        font-weight: 700;
        flex-shrink: 0;
        transition: color 0.15s;
      }

      .channel-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .active-dot {
        background: var(--color-accent);
        border-radius: 50%;
        flex-shrink: 0;
        height: 7px;
        width: 7px;
        box-shadow: 0 0 6px rgba(99,102,241,0.5);
      }
    }
  `],
})
export class ChannelListComponent {
  @Input() channels: Channel[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Channel>();
}
