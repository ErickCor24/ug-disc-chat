import { Component, EventEmitter, Input, Output } from '@angular/core';

import { Channel } from '../../../core/models';

@Component({
  selector: 'app-channel-list',
  standalone: true,
  template: `
    <ul class="channel-list">
      <li class="section-label">Canales</li>
      @for (channel of channels; track channel.id) {
        <li
          class="channel-item"
          [class.active]="selectedId === channel.id"
          (click)="select.emit(channel)"
          (keydown.enter)="select.emit(channel)"
          tabindex="0"
          [attr.aria-label]="'Canal ' + channel.name"
          [attr.aria-current]="selectedId === channel.id ? 'page' : null"
        >
          <span class="hash">#</span>
          {{ channel.name }}
        </li>
      }
    </ul>
  `,
  styles: [`
    .channel-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .section-label {
      color: #667;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      padding: 0.75rem 1rem 0.25rem;
      text-transform: uppercase;
    }

    .channel-item {
      align-items: center;
      border-radius: 4px;
      color: #8899aa;
      cursor: pointer;
      display: flex;
      font-size: 0.9rem;
      gap: 0.4rem;
      margin: 0 0.5rem;
      outline: none;
      padding: 0.45rem 0.75rem;
      transition: background 0.15s, color 0.15s;

      &:hover, &:focus-visible {
        background: rgba(255, 255, 255, 0.06);
        color: #e0e0e0;
      }

      &.active {
        background: rgba(88, 101, 242, 0.25);
        color: #e0e0e0;
        font-weight: 500;
      }

      .hash {
        color: #556;
        font-size: 1rem;
        font-weight: 700;
      }
    }
  `],
})
export class ChannelListComponent {
  @Input() channels: Channel[] = [];
  @Input() selectedId: string | null = null;
  @Output() select = new EventEmitter<Channel>();
}
