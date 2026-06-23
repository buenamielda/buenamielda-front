import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import {
  AuthService,
  EmailAlreadyRegisteredError,
  InactiveUserError,
  InvalidCredentialsError,
  LoginValidationError,
  UserNotFoundError,
} from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  function createToken(payload: Record<string, unknown>): string {
    const base64Payload = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return `header.${base64Payload}.signature`;
  }

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should register using trimmed and normalized data', () => {
    service
      .register({
        nombre: ' Paula ',
        email: ' PAULA@TEST.COM ',
        password: 'Password1!',
      })
      .subscribe((response) => {
        expect(response.email).toBe('paula@test.com');
      });

    const request = httpMock.expectOne('/api/auth/register');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      nombre: 'Paula',
      email: 'paula@test.com',
      password: 'Password1!',
    });

    request.flush({
      id: 1,
      nombre: 'Paula',
      email: 'paula@test.com',
      activo: true,
      roles: ['USUARIO'],
    });
  });

  it('should map duplicated email errors when registering', () => {
    service
      .register({
        nombre: 'Paula',
        email: 'paula@test.com',
        password: 'Password1!',
      })
      .subscribe({
        next: () => fail('Expected EmailAlreadyRegisteredError'),
        error: (error) => {
          expect(error).toEqual(jasmine.any(EmailAlreadyRegisteredError));
        },
      });

    httpMock.expectOne('/api/auth/register').flush(
      { message: 'El email ya existe' },
      { status: 400, statusText: 'Bad Request' },
    );
  });

  it('should login, store token and expose authenticated user', () => {
    const token = createToken({
      id: 7,
      email: 'paula@test.com',
      nombre: 'Paula',
      roles: ['USUARIO'],
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    service
      .login({
        email: ' PAULA@TEST.COM ',
        password: 'Password1!',
      })
      .subscribe((response) => {
        expect(response.token).toBe(token);
      });

    const request = httpMock.expectOne('/api/auth/login');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'paula@test.com',
      password: 'Password1!',
    });

    request.flush({
      id: 7,
      nombre: 'Paula',
      email: 'paula@test.com',
      activo: true,
      roles: ['USUARIO'],
      token,
    });

    expect(localStorage.getItem('auth_token')).toBe(token);
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.hasActiveSession()).toBeTrue();
    expect(service.getAuthenticatedUserId()).toBe(7);
    expect(service.getAuthenticatedEmail()).toBe('paula@test.com');
    expect(service.getAuthenticatedDisplayName()).toBe('Paula');
    expect(service.hasRole('USUARIO')).toBeTrue();
    expect(service.isAdmin()).toBeFalse();
  });

  it('should map invalid credentials when login returns 401', () => {
    service
      .login({
        email: 'paula@test.com',
        password: 'bad',
      })
      .subscribe({
        next: () => fail('Expected InvalidCredentialsError'),
        error: (error) => {
          expect(error).toEqual(jasmine.any(InvalidCredentialsError));
        },
      });

    httpMock.expectOne('/api/auth/login').flush(
      {},
      { status: 401, statusText: 'Unauthorized' },
    );
  });

  it('should map backend validation messages when login returns 400', () => {
    service
      .login({
        email: 'paula@test.com',
        password: 'bad',
      })
      .subscribe({
        next: () => fail('Expected LoginValidationError'),
        error: (error) => {
          expect(error).toEqual(jasmine.any(LoginValidationError));
          expect(error.message).toBe('Usuario inactivo');
        },
      });

    httpMock.expectOne('/api/auth/login').flush(
      { message: 'Usuario inactivo' },
      { status: 400, statusText: 'Bad Request' },
    );
  });

  it('should detect expired tokens', () => {
    const expiredToken = createToken({
      id: 7,
      email: 'paula@test.com',
      exp: Math.floor(Date.now() / 1000) - 10,
    });

    localStorage.setItem('auth_token', expiredToken);

    expect(service.hasActiveSession()).toBeFalse();
  });

  it('should fallback display name to email prefix when token has no name', () => {
    const token = createToken({
      id: 7,
      email: 'paula@test.com',
      roles: ['ADMINISTRADOR'],
    });

    localStorage.setItem('auth_token', token);

    expect(service.getAuthenticatedDisplayName()).toBe('paula');
    expect(service.isAdmin()).toBeTrue();
  });

  it('should logout removing token and current user', () => {
    const token = createToken({
      id: 7,
      email: 'paula@test.com',
    });

    localStorage.setItem('auth_token', token);

    service.logout();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(service.currentUser()).toBeNull();
  });

  it('should throw user not found in password recovery', () => {
    expect(() =>
      service.requestPasswordRecovery({ email: 'missing@test.com' }),
    ).toThrowError(UserNotFoundError);
  });

  it('should not throw when requesting recovery for demo user', () => {
    expect(() =>
      service.requestPasswordRecovery({ email: 'demo@buenamielda.test' }),
    ).not.toThrow();
  });
});