import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 32 32" fill="currentColor" role="img" [attr.aria-label]="label()">
      <path
        fill-rule="evenodd"
        d="M6 3h20a4 4 0 0 1 4 4v13a4 4 0 0 1-4 4H13l-5 5v-5H6a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z
           m3.25 10.5a1.75 1.75 0 1 0 3.5 0 1.75 1.75 0 1 0-3.5 0Z
           m5 0a1.75 1.75 0 1 0 3.5 0 1.75 1.75 0 1 0-3.5 0Z
           m5 0a1.75 1.75 0 1 0 3.5 0 1.75 1.75 0 1 0-3.5 0Z"
      />
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        color: var(--color-accent);
      }

      svg {
        display: block;
        width: 1em;
        height: 1em;
      }
    `,
  ],
})
export class LogoComponent {
  readonly label = input('ChatApp');
}
