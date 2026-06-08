import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import {
  CategoriaAdminRequestDto,
  CategoriaAdminResponseDto,
} from '../models/admin-category.model';

@Injectable({
  providedIn: 'root',
})
export class AdminCategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/admin/categorias';

  private readonly categoriasSignal = signal<CategoriaAdminResponseDto[]>([]);

  readonly categorias = computed(() =>
    [...this.categoriasSignal()].sort((a, b) => a.id - b.id),
  );

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  cargarCategorias(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.http.get<CategoriaAdminResponseDto[]>(this.apiUrl).subscribe({
      next: (categorias) => {
        this.categoriasSignal.set(categorias);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se han podido cargar las categorías.');
        this.cargando.set(false);
      },
    });
  }

  crearCategoria(
    categoria: CategoriaAdminRequestDto,
  ): Observable<CategoriaAdminResponseDto> {
    return this.http
      .post<CategoriaAdminResponseDto>(this.apiUrl, categoria)
      .pipe(
        tap((categoriaCreada) => {
          this.categoriasSignal.update((categorias) => [
            ...categorias,
            categoriaCreada,
          ]);
        }),
      );
  }
}
