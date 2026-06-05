import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { UsuarioAdminResponseDto } from '../models/admin-user.model';

@Injectable({
  providedIn: 'root',
})
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/admin/usuarios';

  private readonly usuariosSignal = signal<UsuarioAdminResponseDto[]>([]);

  readonly usuarios = computed(() =>
    [...this.usuariosSignal()].sort((a, b) => a.id - b.id),
  );

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  cargarUsuarios(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.http.get<UsuarioAdminResponseDto[]>(this.apiUrl).subscribe({
      next: (usuarios) => {
        this.usuariosSignal.set(usuarios);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se han podido cargar los usuarios registrados.');
        this.cargando.set(false);
      },
    });
  }
}