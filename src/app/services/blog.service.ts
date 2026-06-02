import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import {
  EntradaBlog,
  EntradaBlogCreada,
  EntradaBlogDetalle,
  EntradaBlogPayload,
} from '../models/blog.model';

interface MessageResponse {
  message: string;
}

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

    this.http.get<EntradaBlog[] | MessageResponse>(this.apiUrl).subscribe({
      next: (response) => {
        this.entradasSignal.set(Array.isArray(response) ? response : []);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se han podido cargar las entradas del blog.');
        this.cargando.set(false);
      },
    });
  }

  crearEntrada(payload: EntradaBlogPayload): Observable<EntradaBlogCreada> {
    this.error.set(null);

    return this.http
      .post<EntradaBlogCreada>(this.apiUrl, this.toRequestDto(payload))
      .pipe(
        tap((entradaCreada) => {
          if (!entradaCreada.activa) {
            return;
          }

          this.entradasSignal.update((entradas) => [
            ...entradas,
            this.toEntradaListado(entradaCreada),
          ]);
        }),
      );
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

  obtenerEntradaPorId(id: number): Observable<EntradaBlogDetalle> {
    return this.http.get<EntradaBlogDetalle>(`${this.apiUrl}/${id}`);
  }

  actualizarEntrada(
    id: number,
    payload: EntradaBlogPayload,
  ): Observable<EntradaBlogCreada> {
    this.errorDetalle.set(null);

    return this.http
      .put<EntradaBlogCreada>(`${this.apiUrl}/${id}`, this.toRequestDto(payload))
      .pipe(
        tap((entradaActualizada) => {
          this.entradaDetalleSignal.set({
            id: entradaActualizada.id,
            titulo: entradaActualizada.titulo,
            resumen: entradaActualizada.resumen,
            contenido: entradaActualizada.contenido,
            imagenUrl: entradaActualizada.imagenUrl,
            categoria: entradaActualizada.categoria,
            fechaPublicacion: entradaActualizada.fechaPublicacion,
            autor: entradaActualizada.autor,
          });

          this.entradasSignal.update((entradas) =>
            this.actualizarListadoTrasEdicion(entradas, entradaActualizada),
          );
        }),
      );
  }

  private obtenerFecha(entrada: EntradaBlog): number {
    return new Date(entrada.fechaPublicacion).getTime() || 0;
  }

  private toRequestDto(entrada: EntradaBlogPayload): EntradaBlogPayload {
    return {
      titulo: entrada.titulo.trim(),
      resumen: entrada.resumen.trim(),
      contenido: entrada.contenido.trim(),
      imagenUrl: entrada.imagenUrl.trim(),
      categoria: entrada.categoria.trim(),
      activa: entrada.activa,
    };
  }

  private toEntradaListado(entrada: EntradaBlogCreada): EntradaBlog {
    return {
      id: entrada.id,
      titulo: entrada.titulo,
      resumen: entrada.resumen,
      imagenUrl: entrada.imagenUrl,
      categoria: entrada.categoria,
      activa: entrada.activa,
      fechaPublicacion: entrada.fechaPublicacion,
      autor: entrada.autor,
    };
  }

  private actualizarListadoTrasEdicion(
    entradas: EntradaBlog[],
    entradaActualizada: EntradaBlogCreada,
  ): EntradaBlog[] {
    if (!entradaActualizada.activa) {
      return entradas.filter((entrada) => entrada.id !== entradaActualizada.id);
    }

    const entradaListado = this.toEntradaListado(entradaActualizada);
    const existe = entradas.some((entrada) => entrada.id === entradaListado.id);

    if (!existe) {
      return [...entradas, entradaListado];
    }

    return entradas.map((entrada) =>
      entrada.id === entradaListado.id ? entradaListado : entrada,
    );
  }
}
