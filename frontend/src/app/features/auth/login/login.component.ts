import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/ui/icon.component';
import { LogoComponent } from '../../../shared/ui/logo.component';
import { extractErrorMessage } from '../../../shared/utils/http-error.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent, LogoComponent],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="brand">
          <app-logo class="brand-icon" />
          <h1>Bienvenido</h1>
          <p class="subtitle">Inicia sesión para continuar</p>
        </div>

        @if (errorMessage()) {
          <div class="error-banner" role="alert">
            <app-icon name="warning" />
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="correo@ejemplo.com"
              autocomplete="email"
            />
            @if (form.get('email')?.invalid && form.get('email')?.touched) {
              <span class="field-error">Email inválido</span>
            }
          </div>

          <div class="field">
            <label for="password">Contraseña</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          <button class="submit-btn" type="submit" [disabled]="form.invalid || loading()">
            @if (loading()) { Iniciando sesión... } @else { Iniciar Sesión }
          </button>
        </form>

        <p class="switch-auth">
          ¿No tienes cuenta? <a routerLink="/register">Regístrate</a>
        </p>
      </div>
    </div>
  `,
  styleUrl: 'login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    // Redirigido tras una sesión inválida/expirada (cierre WS 4001).
    if (this.route.snapshot.queryParamMap.get('reason') === 'session_expired') {
      this.errorMessage.set('Tu sesión expiró. Inicia sesión de nuevo.');
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.form.value;

    this.authService.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/chat']),
      error: (err) => {
        this.errorMessage.set(extractErrorMessage(err, 'Error al iniciar sesión'));
        this.loading.set(false);
      },
    });
  }
}
