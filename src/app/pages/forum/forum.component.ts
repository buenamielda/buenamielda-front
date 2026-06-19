import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ForumService } from '../../services/forum.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink, MatIconModule],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.scss',
})
export class ForumComponent implements OnInit {
  private readonly forumService = inject(ForumService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly questions = this.forumService.questions;
  readonly loading = this.forumService.loading;
  readonly error = this.forumService.error;

  readonly search = signal('');
  readonly formOpen = signal(false);
  readonly questionTitle = signal('');
  readonly questionContent = signal('');
  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);
  readonly formSuccess = signal<string | null>(null);

  readonly canParticipate = computed(() => this.authService.hasActiveSession());

  readonly filteredQuestions = computed(() => {
    const term = this.search().trim().toLowerCase();

    if (!term) {
      return this.questions();
    }

    return this.questions().filter((question) => {
      const searchable = [
        question.id,
        question.titulo,
        question.nombreUsuario,
        question.estado,
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(term);
    });
  });

  ngOnInit(): void {
    this.forumService.loadQuestions();
  }

  updateSearch(value: string): void {
    this.search.set(value);
  }

  updateQuestionTitle(value: string): void {
    this.questionTitle.set(value);
  }

  updateQuestionContent(value: string): void {
    this.questionContent.set(value);
  }

  toggleQuestionForm(): void {
    if (!this.canParticipate()) {
      this.router.navigate(['/login']);
      return;
    }

    this.formOpen.update((value) => !value);
    this.formError.set(null);
    this.formSuccess.set(null);
  }

  createQuestion(): void {
    const titulo = this.questionTitle().trim();
    const contenido = this.questionContent().trim();

    this.formError.set(null);
    this.formSuccess.set(null);

    if (!this.canParticipate()) {
      this.router.navigate(['/login']);
      return;
    }

    if (titulo.length < 5) {
      this.formError.set('El título debe tener al menos 5 caracteres.');
      return;
    }

    if (contenido.length < 10) {
      this.formError.set('La pregunta debe tener al menos 10 caracteres.');
      return;
    }

    this.submitting.set(true);

    this.forumService.createQuestion({ titulo, contenido }).subscribe({
      next: (question) => {
        this.submitting.set(false);
        this.questionTitle.set('');
        this.questionContent.set('');
        this.formOpen.set(false);
        this.formSuccess.set('Pregunta publicada correctamente.');
        this.router.navigate(['/foro', question.id]);
      },
      error: () => {
        this.submitting.set(false);
        this.formError.set('No se ha podido publicar la pregunta.');
      },
    });
  }

  formatStatus(status: string): string {
    return status === 'PUBLICADA' ? 'Publicada' : 'Eliminada';
  }
}