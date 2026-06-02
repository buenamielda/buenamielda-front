import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { EntradaBlog, EntradaBlogDetalle } from '../models/blog.model';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/blog';

  private readonly entradasSignal = signal<EntradaBlog[]>([]);
  private readonly entradaDetalleSignal = signal<EntradaBlogDetalle | null>(
    null,
  );

  readonly cargando = signal(false);
  readonly cargandoDetalle = signal(false);
  readonly error = signal<string | null>(null);
  readonly errorDetalle = signal<string | null>(null);

  readonly entradas = computed(() =>
    this.entradasSignal()
      .filter((entrada) => entrada.activa)
      .sort((a, b) => this.obtenerFecha(b) - this.obtenerFecha(a)),
  );

  readonly entradaDetalle = this.entradaDetalleSignal.asReadonly();

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

  cargarEntradaPorId(id: number): void {
    this.cargandoDetalle.set(true);
    this.errorDetalle.set(null);
    this.entradaDetalleSignal.set(null);

    this.http.get<EntradaBlogDetalle>(`${this.apiUrl}/${id}`).subscribe({
      next: (entrada) => {
        this.entradaDetalleSignal.set(entrada);
        this.cargandoDetalle.set(false);
      },
      error: () => {
        this.errorDetalle.set(
          'No se ha podido cargar la entrada solicitada.',
        );
        this.cargandoDetalle.set(false);
      },
    });
  }

  private obtenerFecha(entrada: EntradaBlog): number {
    return new Date(entrada.fechaPublicacion).getTime() || 0;
  }
}
