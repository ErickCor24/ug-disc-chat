import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor funcional (Angular 17+).
 * Inyecta el JWT en el header Authorization de cada petición HTTP saliente.
 * No aplica a URLs de WebSocket (WS no usa HttpClient).
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(cloned);
  }

  return next(req);
};
