import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName = 'menu' | 'logout' | 'send' | 'warning' | 'chat-bubble';

@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      @switch (name()) {
        @case ('menu') {
          <path d="M4 7h16M4 12h16M4 17h16" />
        }
        @case ('logout') {
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        }
        @case ('send') {
          <path d="M12 19V5M5 12l7-7 7 7" />
        }
        @case ('warning') {
          <path d="M12 3 2.5 20h19L12 3ZM12 9.5V14M12 17.5h.01" />
        }
        @case ('chat-bubble') {
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
        }
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      svg {
        display: block;
        width: 1em;
        height: 1em;
      }
    `,
  ],
})
export class IconComponent {
  readonly name = input.required<IconName>();
}
