import { Injectable, computed, signal } from '@angular/core';
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
    this.users().map(({ passwordHash, ...user }) => user)
  );
  readonly currentUser = this.authenticatedUser.asReadonly();
  readonly isAuthenticated = computed(() => this.authenticatedUser() !== null);

  register(request: RegistroRequestDto): UsuarioResponseDto {
    const email = request.email.trim().toLowerCase();
    const exists = this.users().some((user) => user.email === email);

    if (exists) {
      throw new EmailAlreadyRegisteredError(email);
    }

    const user: StoredUser = {
      id: this.nextId(),
      nombre: request.nombre.trim(),
      email,
      activo: true,
      roles: ['USER'],
      passwordHash: this.hashPassword(request.password),
    };

    this.users.update((users) => [...users, user]);
    const { passwordHash, ...response } = user;
    return response;
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
