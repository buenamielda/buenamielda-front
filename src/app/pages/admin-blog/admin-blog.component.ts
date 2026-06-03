import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import {
  EntradaBlogCreada,
  FiltroEstadoBlogAdmin,
} from '../../models/blog.model';
import { BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-admin-blog',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, DatePipe],
  templateUrl: './admin-blog.component.html',
  styleUrl: './admin-blog.component.scss',
})
export class AdminBlogComponent implements OnInit {
  private readonly blogService = inject(BlogService);

  readonly entradas = this.blogService.entradasAdmin;
  readonly cargando = this.blogService.cargandoAdmin;
  readonly error = this.blogService.errorAdmin;
  readonly filtroEstado = signal<FiltroEstadoBlogAdmin>('todas');
  readonly accionEnCursoId = signal<number | null>(null);

  readonly entradasFiltradas = computed(() => {
    const filtro = this.filtroEstado();

    if (filtro === 'activas') {
      return this.entradas().filter((entrada) => entrada.activa);
    }

    if (filtro === 'inactivas') {
      return this.entradas().filter((entrada) => !entrada.activa);
    }

    return this.entradas();
  });

  readonly totalActivas = computed(
    () => this.entradas().filter((entrada) => entrada.activa).length,
  );

  readonly totalInactivas = computed(
    () => this.entradas().filter((entrada) => !entrada.activa).length,
  );

  ngOnInit(): void {
    this.blogService.cargarEntradasAdmin();
  }

  cambiarFiltro(filtro: FiltroEstadoBlogAdmin): void {
    this.filtroEstado.set(filtro);
  }

  alternarPublicacion(entrada: EntradaBlogCreada): void {
    this.accionEnCursoId.set(entrada.id);

    this.blogService
      .actualizarPublicacionComoAdministrador(entrada.id, {
        activa: !entrada.activa,
      })
      .subscribe({
        next: () => this.accionEnCursoId.set(null),
        error: () => this.accionEnCursoId.set(null),
      });
  }
}
