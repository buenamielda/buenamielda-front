import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';

import {
  LoginRequestDto,
  LoginResponseDto,
  PasswordRecoveryRequestDto,
  RegistroRequestDto,
  UsuarioResponseDto,
} from '../models/auth.model';

interface StoredUser extends UsuarioResponseDto {
  passwordHash: string;
}

export class EmailAlreadyRegisteredError extends Error {
  constructor(email: string) {
    super(`El email ${email} ya esta registrado.`);
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Credenciales incorrectas.');
  }
}

export class InactiveUserError extends Error {
  constructor() {
    super('El usuario no esta activo.');
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('Usuario no encontrado.');
  }
}

export class LoginValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';
  private readonly tokenStorageKey = 'auth_token';

  private readonly users = signal<StoredUser[]>([
    {
      id: 1,
      nombre: 'Usuario Demo',
      email: 'demo@buenamielda.test',
      activo: true,
      roles: ['USER'],
      passwordHash: this.hashPassword('password123'),
    },
  ]);

  private readonly authenticatedUser = signal<LoginResponseDto | null>(null);

  readonly registeredUsers = computed<UsuarioResponseDto[]>(() =>
    this.users().map(({ passwordHash, ...user }) => user),
  );
  readonly currentUser = this.authenticatedUser.asReadonly();
  readonly isAuthenticated = computed(() => this.authenticatedUser() !== null);

  register(request: RegistroRequestDto): Observable<UsuarioResponseDto> {
    const body: RegistroRequestDto = {
      nombre: request.nombre.trim(),
      email: request.email.trim().toLowerCase(),
      password: request.password,
    };

    return this.http
      .post<UsuarioResponseDto>(`${this.apiUrl}/register`, body)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          const message = error.error?.message ?? '';

          if (
            error.status === 400 ||
            error.status === 404 ||
            message.toLowerCase().includes('email')
          ) {
            return throwError(
              () => new EmailAlreadyRegisteredError(body.email),
            );
          }

          return throwError(() => error);
        }),
      );
  }

  login(request: LoginRequestDto): Observable<LoginResponseDto> {
    const body: LoginRequestDto = {
      email: request.email.trim().toLowerCase(),
      password: request.password,
    };

    return this.http.post<LoginResponseDto>(`${this.apiUrl}/login`, body).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenStorageKey, response.token);
        this.authenticatedUser.set(response);
      }),
      catchError((error: HttpErrorResponse) => {
        const message = this.getErrorMessage(error);

        if (error.status === 401) {
          return throwError(() => new InvalidCredentialsError());
        }

        if (error.status === 400 && message) {
          return throwError(() => new LoginValidationError(message));
        }

        return throwError(() => error);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenStorageKey);
    this.authenticatedUser.set(null);
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string') {
      return error.error;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    if (error.error && typeof error.error === 'object') {
      return Object.values(error.error).join(' ');
    }

    return '';
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  hasActiveSession(): boolean {
    return (
      this.authenticatedUser() !== null &&
      this.getAuthenticatedUserId() !== null
    );
  }

  getAuthenticatedUserId(): number | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    const payload = this.decodeTokenPayload(token);

    const rawId =
      payload?.['idUsuario'] ??
      payload?.['usuarioId'] ??
      payload?.['userId'] ??
      payload?.['id'] ??
      payload?.['sub'];
    const id = Number(rawId);

    return Number.isFinite(id) ? id : null;
  }

  getAuthenticatedEmail(): string {
    const token = this.getToken();
    const payload = token ? this.decodeTokenPayload(token) : null;

    const email =
      payload?.['email'] ?? payload?.['sub'] ?? payload?.['username'] ?? '';

    return typeof email === 'string' ? email : '';
  }

  private decodeTokenPayload(token: string): Record<string, unknown> | null {
    try {
      const [, payload] = token.split('.');

      if (!payload) {
        return null;
      }

      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = atob(normalizedPayload);

      return JSON.parse(decodedPayload);
    } catch {
      return null;
    }
  }

  requestPasswordRecovery(request: PasswordRecoveryRequestDto): void {
    const email = request.email.trim().toLowerCase();
    const user = this.users().find((storedUser) => storedUser.email === email);

    if (!user) {
      throw new UserNotFoundError();
    }

    if (!user.activo) {
      throw new InactiveUserError();
    }

    // Mock frontend: el backend enviara el email desde buenamieldamicolmena@gmail.com.
  }

  private nextId(): number {
    return Math.max(0, ...this.users().map((user) => user.id)) + 1;
  }

  private hashPassword(password: string): string {
    return `mock-hash:${password}`;
  }

  getCurrentUserId(): number | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Number(payload.id);
    } catch {
      return null;
    }
  }
}
