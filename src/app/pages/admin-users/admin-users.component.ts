import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { AdminUserService } from '../../services/admin-user.service';

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

  formatearRoles(roles: string[]): string {
    if (!roles.length) {
      return 'Sin rol';
    }

    return roles
      .map((rol) => rol.charAt(0).toUpperCase() + rol.slice(1).toLowerCase())
      .join(', ');
  }
}