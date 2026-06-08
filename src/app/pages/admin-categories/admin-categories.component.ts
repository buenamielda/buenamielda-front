import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';

import { CategoriaAdminRequestDto } from '../../models/admin-category.model';
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

  crearCategoria(): void {
    const nombre = this.formulario().nombre.trim();
    const descripcion = this.formulario().descripcion.trim();

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

    this.categoryService.crearCategoria(request).subscribe({
      next: (categoria) => {
        this.mensajeExito.set(
          `La categoría "${categoria.nombre}" se ha creado correctamente.`,
        );

        this.formulario.set({
          nombre: '',
          descripcion: '',
          activa: true,
        });

        this.guardando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorCreacion.set(
          error.error?.message ?? 'No se ha podido crear la categoría.',
        );

        this.guardando.set(false);
      },
    });
  }
}
