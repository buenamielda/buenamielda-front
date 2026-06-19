import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ForumService } from '../../services/forum.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forum-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink, MatIconModule],
  templateUrl: './forum-detail.component.html',
  styleUrl: './forum-detail.component.scss',
})
export class ForumDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly forumService = inject(ForumService);
  private readonly authService = inject(AuthService);

  readonly question = this.forumService.selectedQuestion;
  readonly loading = this.forumService.detailLoading;
  readonly error = this.forumService.detailError;

  readonly answerContent = signal('');
  readonly submittingAnswer = signal(false);
  readonly answerError = signal<string | null>(null);
  readonly answerSuccess = signal<string | null>(null);

  readonly deleteError = signal<string | null>(null);
  readonly deleteSuccess = signal<string | null>(null);
  readonly deletingQuestion = signal(false);
  readonly deletingAnswerId = signal<number | null>(null);

  private questionId: number | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isFinite(id) || id <= 0) {
      this.router.navigate(['/foro']);
      return;
    }

    this.questionId = id;
    this.forumService.loadQuestionById(id);
  }

  ngOnDestroy(): void {
    this.forumService.clearSelectedQuestion();
  }

  updateAnswerContent(value: string): void {
    this.answerContent.set(value);
  }

  canDeleteContent(ownerId: number): boolean {
    if (!this.authService.hasActiveSession()) {
      return false;
    }

    if (this.authService.isAdmin()) {
      return true;
    }

    return (
      this.authService.hasRole('USUARIO') &&
      this.authService.getAuthenticatedUserId() === ownerId
    );
  }

  createAnswer(): void {
    const contenido = this.answerContent().trim();

    this.answerError.set(null);
    this.answerSuccess.set(null);

    if (!this.authService.hasActiveSession()) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.questionId) {
      this.answerError.set('No se ha podido identificar la pregunta.');
      return;
    }

    if (contenido.length < 5) {
      this.answerError.set('La respuesta debe tener al menos 5 caracteres.');
      return;
    }

    this.submittingAnswer.set(true);

    this.forumService.createAnswer(this.questionId, { contenido }).subscribe({
      next: () => {
        this.submittingAnswer.set(false);
        this.answerContent.set('');
        this.answerSuccess.set('Respuesta publicada correctamente.');
      },
      error: () => {
        this.submittingAnswer.set(false);
        this.answerError.set('No se ha podido publicar la respuesta.');
      },
    });
  }

  deleteQuestion(): void {
    if (!this.questionId) {
      return;
    }

    const confirmed = confirm(
      '¿Seguro que quieres eliminar esta pregunta? También se ocultarán sus respuestas.',
    );

    if (!confirmed) {
      return;
    }

    this.deleteError.set(null);
    this.deleteSuccess.set(null);
    this.deletingQuestion.set(true);

    this.forumService.deleteQuestion(this.questionId).subscribe({
      next: () => {
        this.deletingQuestion.set(false);
        this.router.navigate(['/foro']);
      },
      error: () => {
        this.deletingQuestion.set(false);
        this.deleteError.set('No se ha podido eliminar la pregunta.');
      },
    });
  }

  deleteAnswer(answerId: number): void {
    if (!this.questionId) {
      return;
    }

    const confirmed = confirm('¿Seguro que quieres eliminar esta respuesta?');

    if (!confirmed) {
      return;
    }

    this.deleteError.set(null);
    this.deleteSuccess.set(null);
    this.deletingAnswerId.set(answerId);

    this.forumService.deleteAnswer(this.questionId, answerId).subscribe({
      next: () => {
        this.deletingAnswerId.set(null);
        this.deleteSuccess.set('Respuesta eliminada correctamente.');
      },
      error: () => {
        this.deletingAnswerId.set(null);
        this.deleteError.set('No se ha podido eliminar la respuesta.');
      },
    });
  }
}