import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { EntradaBlog } from '../models/blog.model';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/blog';

  private readonly entradasSignal = signal<EntradaBlog[]>([]);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly entradas = computed(() =>
    this.entradasSignal()
      .filter((entrada) => entrada.activa)
      .sort((a, b) => this.obtenerFecha(b) - this.obtenerFecha(a)),
  );

  cargarEntradas(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.http.get<EntradaBlog[]>(this.apiUrl).subscribe({
      next: (entradas) => {
        this.entradasSignal.set(entradas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se han podido cargar las entradas del blog.');
        this.cargando.set(false);
      },
    });
  }

  private obtenerFecha(entrada: EntradaBlog): number {
    return new Date(entrada.fechaPublicacion).getTime() || 0;
  }
}
