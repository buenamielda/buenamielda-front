import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import {
  UsuarioAdminResponseDto,
  UsuarioAdminUpdateRequestDto,
} from '../../models/admin-user.model';
import { AdminUserService } from '../admin-user.service';

describe('AdminUserService', () => {
  let service: AdminUserService;
  let httpMock: HttpTestingController;

  const users: UsuarioAdminResponseDto[] = [
    {
      id: 2,
      nombre: 'Usuario Dos',
      email: 'dos@test.com',
      activo: true,
      roles: ['USUARIO'],
    },
    {
      id: 1,
      nombre: 'Admin Uno',
      email: 'admin@test.com',
      activo: true,
      roles: ['ADMINISTRADOR'],
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AdminUserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load users and sort them by id', () => {
    service.cargarUsuarios();

    const request = httpMock.expectOne('/api/admin/usuarios');

    expect(request.request.method).toBe('GET');

    request.flush(users);

    expect(service.cargando()).toBeFalse();
    expect(service.error()).toBeNull();
    expect(service.usuarios().map((user) => user.id)).toEqual([1, 2]);
  });

  it('should set controlled error when loading users fails', () => {
    service.cargarUsuarios();

    httpMock
      .expectOne('/api/admin/usuarios')
      .flush({}, { status: 500, statusText: 'Server Error' });

    expect(service.cargando()).toBeFalse();
    expect(service.error()).toBe(
      'No se han podido cargar los usuarios registrados.',
    );
  });

  it('should update user and replace it in state', () => {
    service.cargarUsuarios();
    httpMock.expectOne('/api/admin/usuarios').flush(users);

    const requestPayload: UsuarioAdminUpdateRequestDto = {
      nombre: 'Usuario Dos Modificado',
      email: 'dos@test.com',
      activo: false,
      rol: 'USUARIO',
    };

    const updatedUser: UsuarioAdminResponseDto = {
      id: 2,
      nombre: 'Usuario Dos Modificado',
      email: 'dos@test.com',
      activo: false,
      roles: ['USUARIO'],
    };

    service.actualizarUsuario(2, requestPayload).subscribe((response) => {
      expect(response).toEqual(updatedUser);
    });

    const request = httpMock.expectOne('/api/admin/usuarios/2');

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(requestPayload);

    request.flush(updatedUser);

    expect(service.usuarios().find((user) => user.id === 2)).toEqual(
      updatedUser,
    );
  });
});
