import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { AdminCategoryService } from '../../services/admin-category.service';

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

  ngOnInit(): void {
    this.categoryService.cargarCategorias();
  }
}