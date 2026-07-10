import { Component, input } from '@angular/core';

import { ConnectedUser } from '../../../core/models';
import { getAvatarColor, getAvatarBgColor, getAvatarInitial } from '../../../shared/utils/avatar.util';

@Component({
  selector: 'app-user-list',
  standalone: true,
  template: `
    <div class="user-list-container">
      <div class="user-list-header">
        <span>En línea — {{ users().length }}</span>
      </div>
      <ul class="user-list" role="list">
        @for (user of users(); track user.user_id) {
          <li class="user-item">
            <div class="avatar"
              [style.background]="getAvatarBgColor(user.username)"
              [style.color]="getAvatarColor(user.username)"
              [attr.aria-label]="user.username">
              {{ getAvatarInitial(user.username) }}
            </div>
            <span class="username">{{ user.username }}</span>
          </li>
        }
      </ul>
    </div>
  `,
  styles: [`
    .user-list-container {
      display: flex;
      flex-direction: column;
      border-top: 1px solid var(--color-border);
      padding: 0.75rem 0;
      flex-shrink: 0;
    }

    .user-list-header {
      align-items: center;
      color: var(--color-text-light);
      display: flex;
      font-size: 0.72rem;
      font-weight: 700;
      justify-content: space-between;
      letter-spacing: 0.07em;
      padding: 0.75rem 0.75rem 0.4rem;
      text-transform: uppercase;
    }

    .user-list {
      list-style: none;
      margin: 0;
      padding: 0 0.5rem;
    }

    .user-item {
      align-items: center;
      border-radius: var(--radius-sm);
      color: var(--color-text-muted);
      display: flex;
      font-size: 0.95rem;
      font-weight: 500;
      gap: 0.5rem;
      padding: 0.55rem 0.75rem;
      transition: background 0.15s, color 0.15s, transform 0.1s;
      position: relative;

      &:hover {
        background: rgba(99, 102, 241, 0.07);
        color: var(--color-text);
        transform: translateX(2px);
      }
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
      border: 1.5px solid rgba(255,255,255,0.7);
    }

    .username {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `],
})
export class UserListComponent {
  readonly users = input<ConnectedUser[]>([]);

  getAvatarColor = getAvatarColor;
  getAvatarBgColor = getAvatarBgColor;
  getAvatarInitial = getAvatarInitial;
}
