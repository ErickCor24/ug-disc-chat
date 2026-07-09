import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { TokenResponse, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // ── Estado reactivo con Signals ────────────────────────────────────────
  private readonly _currentUser = signal<User | null>(this._loadUserFromStorage());

  /** Usuario actual (readonly para los consumers). */
  readonly currentUser = this._currentUser.asReadonly();

  /** true si hay sesión activa. */
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  // ── Métodos públicos ───────────────────────────────────────────────────

  register(username: string, email: string, password: string) {
    return this.http
      .post<TokenResponse>(`${environment.apiUrl}/auth/register`, {
        username,
        email,
        password,
      })
      .pipe(tap((res) => this._handleAuthResponse(res)));
  }

  login(email: string, password: string) {
    return this.http
      .post<TokenResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this._handleAuthResponse(res)));
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // ── Métodos privados ───────────────────────────────────────────────────

  private _handleAuthResponse(res: TokenResponse): void {
    localStorage.setItem('access_token', res.access_token);
    const user: User = { user_id: res.user_id, username: res.username };
    localStorage.setItem('current_user', JSON.stringify(user));
    this._currentUser.set(user);
  }

  private _loadUserFromStorage(): User | null {
    try {
      const raw = localStorage.getItem('current_user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
