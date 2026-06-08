import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';

import {
  CategoriaAdminRequestDto,
  CategoriaAdminResponseDto,
} from '../../models/admin-category.model';
import { AdminCategoryService } from '../../services/admin-category.service';

interface FormularioCategoria {
  nombre: string;
  descripcion: string;
  activa: boolean;
}

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
})
export class AdminCategoriesComponent implements OnInit {
  private readonly categoryService = inject(AdminCategoryService);

  readonly categorias = this.categoryService.categorias;
  readonly cargando = this.categoryService.cargando;
  readonly error = this.categoryService.error;
  readonly busqueda = signal('');
  readonly editingId = signal<number | null>(null);

  readonly categoriasFiltradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();

    if (!texto) {
      return this.categorias();
    }

    return this.categorias().filter((categoria) =>
      [
        categoria.id.toString(),
        categoria.nombre,
        categoria.descripcion ?? '',
        categoria.activa ? 'activa' : 'inactiva',
      ]
        .join(' ')
        .toLowerCase()
        .includes(texto),
    );
  });

  readonly totalActivas = computed(
    () => this.categorias().filter((categoria) => categoria.activa).length,
  );

  readonly totalInactivas = computed(
    () => this.categorias().filter((categoria) => !categoria.activa).length,
  );

  readonly formulario = signal<FormularioCategoria>({
    nombre: '',
    descripcion: '',
    activa: true,
  });

  readonly guardando = signal(false);
  readonly cambiandoEstadoId = signal<number | null>(null);
  readonly errorEstado = signal<string | null>(null);
  readonly mensajeEstado = signal<string | null>(null);
  readonly errorCreacion = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  ngOnInit(): void {
    this.categoryService.cargarCategorias();
  }

  cambiarCampo<K extends keyof FormularioCategoria>(
    campo: K,
    valor: FormularioCategoria[K],
  ): void {
    this.formulario.update((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  guardarCategoria(): void {
    const nombre = this.formulario().nombre.trim();
    const descripcion = this.formulario().descripcion.trim();
    const editingId = this.editingId();

    this.errorCreacion.set(null);
    this.mensajeExito.set(null);

    if (!nombre) {
      this.errorCreacion.set('Introduce el nombre de la categoría.');
      return;
    }

    const request: CategoriaAdminRequestDto = {
      nombre,
      descripcion,
      activa: this.formulario().activa,
    };

    this.guardando.set(true);

    const operacion = editingId
      ? this.categoryService.actualizarCategoria(editingId, request)
      : this.categoryService.crearCategoria(request);

    operacion.subscribe({
      next: (categoria) => {
        this.mensajeExito.set(
          editingId
            ? `La categoría "${categoria.nombre}" se ha modificado correctamente.`
            : `La categoría "${categoria.nombre}" se ha creado correctamente.`,
        );

        this.reiniciarFormulario();
        this.guardando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorCreacion.set(
          error.error?.message ?? 'No se ha podido guardar la categoría.',
        );

        this.guardando.set(false);
      },
    });
    const categoriaActual = editingId
      ? this.categorias().find((categoria) => categoria.id === editingId)
      : null;

    if (
      categoriaActual?.activa &&
      !request.activa &&
      !window.confirm(
        `¿Quieres desactivar la categoría "${categoriaActual.nombre}"? Sus productos asociados también serán desactivados.`,
      )
    ) {
      return;
    }
  }
  editarCategoria(categoria: CategoriaAdminResponseDto): void {
    this.editingId.set(categoria.id);

    this.formulario.set({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? '',
      activa: categoria.activa,
    });

    this.errorCreacion.set(null);
    this.mensajeExito.set(null);
  }

  cancelarEdicion(): void {
    this.reiniciarFormulario();
    this.errorCreacion.set(null);
    this.mensajeExito.set(null);
  }

  private reiniciarFormulario(): void {
    this.editingId.set(null);

    this.formulario.set({
      nombre: '',
      descripcion: '',
      activa: true,
    });
  }

  alternarEstadoCategoria(categoria: CategoriaAdminResponseDto): void {
    this.errorEstado.set(null);
    this.mensajeEstado.set(null);

    if (categoria.activa) {
      const confirmado = window.confirm(
        `¿Quieres desactivar la categoría "${categoria.nombre}"? Sus productos asociados también serán desactivados.`,
      );

      if (!confirmado) {
        return;
      }

      this.desactivarCategoria(categoria);
      return;
    }

    this.activarCategoria(categoria);
  }

  private activarCategoria(categoria: CategoriaAdminResponseDto): void {
    const request: CategoriaAdminRequestDto = {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? '',
      activa: true,
    };

    this.cambiandoEstadoId.set(categoria.id);

    this.categoryService.actualizarCategoria(categoria.id, request).subscribe({
      next: () => {
        this.mensajeEstado.set(
          `La categoría "${categoria.nombre}" se ha activado correctamente.`,
        );

        this.actualizarFormularioSiEstaEditando(categoria.id, true);
        this.cambiandoEstadoId.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.errorEstado.set(
          error.error?.message ?? 'No se ha podido activar la categoría.',
        );

        this.cambiandoEstadoId.set(null);
      },
    });
  }

  private desactivarCategoria(categoria: CategoriaAdminResponseDto): void {
    this.cambiandoEstadoId.set(categoria.id);

    this.categoryService.desactivarCategoria(categoria.id).subscribe({
      next: () => {
        this.mensajeEstado.set(
          `La categoría "${categoria.nombre}" se ha desactivado correctamente.`,
        );

        this.actualizarFormularioSiEstaEditando(categoria.id, false);
        this.cambiandoEstadoId.set(null);
      },
      error: (error: HttpErrorResponse) => {
        this.errorEstado.set(
          error.error?.message ?? 'No se ha podido desactivar la categoría.',
        );

        this.cambiandoEstadoId.set(null);
      },
    });
  }

  private actualizarFormularioSiEstaEditando(
    categoriaId: number,
    activa: boolean,
  ): void {
    if (this.editingId() !== categoriaId) {
      return;
    }

    this.formulario.update((formulario) => ({
      ...formulario,
      activa,
    }));
  }
}
