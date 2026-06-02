import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { EntradaBlogPayload } from '../../models/blog.model';
import { BlogService } from '../../services/blog.service';

interface BlogForm {
  titulo: string;
  resumen: string;
  contenido: string;
  imagenUrl: string;
  categoria: string;
  activa: boolean;
}

@Component({
  selector: 'app-blog-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  templateUrl: './blog-create.component.html',
  styleUrl: './blog-create.component.scss',
})
export class BlogCreateComponent {
  private readonly blogService = inject(BlogService);
  private readonly router = inject(Router);

  readonly form = signal<BlogForm>(this.formularioVacio());
  readonly submitted = signal(false);
  readonly loading = signal(false);
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

  updateField<K extends keyof BlogForm>(field: K, value: BlogForm[K]): void {
    this.form.update((current) => ({ ...current, [field]: value }));
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  guardar(activa: boolean): void {
    this.submitted.set(true);
    this.form.update((current) => ({ ...current, activa }));

    if (!this.canSubmit()) {
      this.errorMessage.set('Completa los campos obligatorios antes de guardar.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.blogService
      .crearEntrada(this.toPayload({ ...this.form(), activa }))
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (entrada) => {
          this.successMessage.set(
            activa
              ? 'Entrada publicada correctamente.'
              : 'Entrada guardada como borrador.',
          );
          this.submitted.set(false);

          if (entrada.activa) {
            this.router.navigate(['/blog', entrada.id]);
          } else {
            this.form.set(this.formularioVacio());
          }
        },
        error: () => {
          this.errorMessage.set(
            'No se ha podido guardar la entrada. Revisa los datos e intentalo de nuevo.',
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

  private formularioVacio(): BlogForm {
    return {
      titulo: '',
      resumen: '',
      contenido: '',
      imagenUrl: 'assets/images/hero-colmenas.jpg',
      categoria: 'Apicultura',
      activa: true,
    };
  }

  private toPayload(form: BlogForm): EntradaBlogPayload {
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
