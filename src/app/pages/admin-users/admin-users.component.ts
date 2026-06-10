import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import {
  RolUsuarioAdmin,
  UsuarioAdminResponseDto,
  UsuarioAdminUpdateRequestDto,
} from '../../models/admin-user.model';
import { AdminUserService } from '../../services/admin-user.service';

interface FormularioUsuario {
  nombre: string;
  email: string;
  activo: boolean;
  rol: RolUsuarioAdmin;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private readonly adminUserService = inject(AdminUserService);

  readonly usuarios = this.adminUserService.usuarios;
  readonly cargando = this.adminUserService.cargando;
  readonly error = this.adminUserService.error;
  readonly busqueda = signal('');

  readonly editingId = signal<number | null>(null);
  readonly guardando = signal(false);
  readonly mensajeExito = signal<string | null>(null);
  readonly errorEdicion = signal<string | null>(null);

  readonly rolesDisponibles: RolUsuarioAdmin[] = [
    'USUARIO',
    'DIVULGATIVO',
    'ADMINISTRADOR',
  ];

  readonly formulario = signal<FormularioUsuario>({
    nombre: '',
    email: '',
    activo: true,
    rol: 'USUARIO',
  });

  readonly usuariosFiltrados = computed(() => {
    const textoBusqueda = this.busqueda().trim().toLowerCase();

    if (!textoBusqueda) {
      return this.usuarios();
    }

    return this.usuarios().filter((usuario) =>
      [
        usuario.id.toString(),
        usuario.nombre,
        usuario.email,
        usuario.activo ? 'activo' : 'inactivo',
        ...usuario.roles,
      ]
        .join(' ')
        .toLowerCase()
        .includes(textoBusqueda),
    );
  });

  readonly totalActivos = computed(
    () => this.usuarios().filter((usuario) => usuario.activo).length,
  );

  readonly totalInactivos = computed(
    () => this.usuarios().filter((usuario) => !usuario.activo).length,
  );

  ngOnInit(): void {
    this.adminUserService.cargarUsuarios();
  }

  cambiarCampo<K extends keyof FormularioUsuario>(
    campo: K,
    valor: FormularioUsuario[K],
  ): void {
    this.formulario.update((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  editarUsuario(usuario: UsuarioAdminResponseDto): void {
    this.editingId.set(usuario.id);

    this.formulario.set({
      nombre: usuario.nombre,
      email: usuario.email,
      activo: usuario.activo,
      rol: this.obtenerRolPrincipal(usuario.roles),
    });

    this.mensajeExito.set(null);
    this.errorEdicion.set(null);
  }

  guardarUsuario(): void {
    const id = this.editingId();
    const formulario = this.formulario();

    this.mensajeExito.set(null);
    this.errorEdicion.set(null);

    if (!id) {
      return;
    }

    if (!formulario.nombre.trim()) {
      this.errorEdicion.set('Introduce el nombre del usuario.');
      return;
    }

    if (!formulario.email.trim()) {
      this.errorEdicion.set('Introduce el correo electrónico del usuario.');
      return;
    }

    const request: UsuarioAdminUpdateRequestDto = {
      nombre: formulario.nombre.trim(),
      email: formulario.email.trim(),
      activo: formulario.activo,
      rol: formulario.rol,
    };

    this.guardando.set(true);

    this.adminUserService.actualizarUsuario(id, request).subscribe({
      next: (usuario) => {
        this.mensajeExito.set(
          `El usuario "${usuario.nombre}" se ha actualizado correctamente.`,
        );

        this.cancelarEdicion(false);
        this.guardando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorEdicion.set(
          error.error?.message ?? 'No se ha podido actualizar el usuario.',
        );

        this.guardando.set(false);
      },
    });
  }

  cancelarEdicion(limpiarMensajes = true): void {
    this.editingId.set(null);

    this.formulario.set({
      nombre: '',
      email: '',
      activo: true,
      rol: 'USUARIO',
    });

    if (limpiarMensajes) {
      this.mensajeExito.set(null);
      this.errorEdicion.set(null);
    }
  }

  formatearRoles(roles: string[]): string {
    if (!roles.length) {
      return 'Sin rol';
    }

    return roles
      .map((rol) => rol.charAt(0).toUpperCase() + rol.slice(1).toLowerCase())
      .join(', ');
  }

  formatearRol(rol: string): string {
    return rol.charAt(0).toUpperCase() + rol.slice(1).toLowerCase();
  }

  private obtenerRolPrincipal(roles: string[]): RolUsuarioAdmin {
    const rol = roles[0];

    if (
      rol === 'ADMINISTRADOR' ||
      rol === 'DIVULGATIVO' ||
      rol === 'USUARIO'
    ) {
      return rol;
    }

    return 'USUARIO';
  }
}