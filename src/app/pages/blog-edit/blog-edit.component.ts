import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import {
  EntradaBlogDetalle,
  EntradaBlogPayload,
} from '../../models/blog.model';
import { BlogService } from '../../services/blog.service';

interface BlogEditForm {
  titulo: string;
  resumen: string;
  contenido: string;
  imagenUrl: string;
  categoria: string;
  activa: boolean;
}

@Component({
  selector: 'app-blog-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  templateUrl: './blog-edit.component.html',
  styleUrl: './blog-edit.component.scss',
})
export class BlogEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blogService = inject(BlogService);

  readonly form = signal<BlogEditForm>(this.formularioVacio());
  readonly entradaId = signal<number | null>(null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly submitted = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly canSubmit = computed(() => {
    const value = this.form();

    return (
      value.titulo.trim().length > 0 &&
      value.resumen.trim().length > 0 &&
      value.contenido.trim().length > 0 &&
      value.categoria.trim().length > 0
    );
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || Number.isNaN(id)) {
      this.router.navigate(['/blog']);
      return;
    }

    this.entradaId.set(id);
    this.cargarEntrada(id);
  }

  updateField<K extends keyof BlogEditForm>(
    field: K,
    value: BlogEditForm[K],
  ): void {
    this.form.update((current) => ({ ...current, [field]: value }));
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  guardarCambios(): void {
    this.submitted.set(true);

    if (!this.canSubmit()) {
      this.errorMessage.set('Completa los campos obligatorios antes de guardar.');
      return;
    }

    const id = this.entradaId();

    if (!id) {
      this.errorMessage.set('No se ha podido identificar la entrada.');
      return;
    }

    this.guardando.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.blogService
      .actualizarEntrada(id, this.toPayload(this.form()))
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (entrada) => {
          this.submitted.set(false);

          if (entrada.activa) {
            this.router.navigate(['/blog', entrada.id]);
            return;
          }

          this.successMessage.set(
            'Entrada actualizada y desactivada correctamente.',
          );
        },
        error: () => {
          this.errorMessage.set(
            'No se ha podido modificar la entrada. Revisa los datos e intentalo de nuevo.',
          );
        },
      });
  }

  showTitleError(): boolean {
    return this.submitted() && this.form().titulo.trim().length === 0;
  }

  showSummaryError(): boolean {
    return this.submitted() && this.form().resumen.trim().length === 0;
  }

  showContentError(): boolean {
    return this.submitted() && this.form().contenido.trim().length === 0;
  }

  showCategoryError(): boolean {
    return this.submitted() && this.form().categoria.trim().length === 0;
  }

  private cargarEntrada(id: number): void {
    this.cargando.set(true);
    this.errorMessage.set('');

    this.blogService
      .obtenerEntradaPorId(id)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (entrada) => this.form.set(this.toForm(entrada)),
        error: () => {
          this.errorMessage.set(
            'La entrada no existe o no esta disponible para su edicion.',
          );
        },
      });
  }

  private formularioVacio(): BlogEditForm {
    return {
      titulo: '',
      resumen: '',
      contenido: '',
      imagenUrl: 'assets/images/hero-colmenas.jpg',
      categoria: 'Apicultura',
      activa: true,
    };
  }

  private toForm(entrada: EntradaBlogDetalle): BlogEditForm {
    return {
      titulo: entrada.titulo,
      resumen: entrada.resumen,
      contenido: entrada.contenido,
      imagenUrl: entrada.imagenUrl,
      categoria: entrada.categoria,
      activa: true,
    };
  }

  private toPayload(form: BlogEditForm): EntradaBlogPayload {
    return {
      titulo: form.titulo,
      resumen: form.resumen,
      contenido: form.contenido,
      imagenUrl: form.imagenUrl,
      categoria: form.categoria,
      activa: form.activa,
    };
  }
}
