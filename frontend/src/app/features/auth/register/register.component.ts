import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h1>Crear Cuenta</h1>
        <p class="subtitle">Únete a la comunidad</p>

        @if (errorMessage()) {
          <div class="error-banner">{{ errorMessage() }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label for="username">Usuario</label>
            <input
              id="username"
              type="text"
              formControlName="username"
              placeholder="tu_usuario"
              autocomplete="username"
            />
            @if (form.get('username')?.invalid && form.get('username')?.touched) {
              <span class="field-error">Mínimo 3 caracteres</span>
            }
          </div>

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
              placeholder="Mínimo 8 caracteres"
              autocomplete="new-password"
            />
            @if (form.get('password')?.invalid && form.get('password')?.touched) {
              <span class="field-error">Mínimo 8 caracteres</span>
            }
          </div>

          <button type="submit" [disabled]="form.invalid || loading()">
            @if (loading()) {
              Creando cuenta...
            } @else {
              Registrarse
            }
          </button>
        </form>

        <p class="switch-auth">
          ¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a>
        </p>
      </div>
    </div>
  `,
  styleUrl: '../login/login.component.scss',
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const { username, email, password } = this.form.value;

    this.authService.register(username!, email!, password!).subscribe({
      next: () => this.router.navigate(['/chat']),
      error: (err) => {
        this.errorMessage.set(err.error?.detail ?? 'Error al registrarse');
        this.loading.set(false);
      },
    });
  }
}
