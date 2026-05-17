import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';

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
          return throwError(() => new EmailAlreadyRegisteredError(body.email));
        }

        return throwError(() => error);
      })
    );
}

  login(request: LoginRequestDto): LoginResponseDto {
    const email = request.email.trim().toLowerCase();
    const user = this.users().find((storedUser) => storedUser.email === email);

    if (!user || user.passwordHash !== this.hashPassword(request.password)) {
      throw new InvalidCredentialsError();
    }

    if (!user.activo) {
      throw new InactiveUserError();
    }

    const response: LoginResponseDto = {
      idUsuario: user.id,
      nombre: user.nombre,
      email: user.email,
      activo: user.activo,
      roles: user.roles,
    };

    this.authenticatedUser.set(response);
    return response;
  }

  logout(): void {
    this.authenticatedUser.set(null);
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
}
