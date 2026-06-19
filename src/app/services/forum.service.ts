import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  ForumAnswerCreateRequest,
  ForumAnswerResponse,
  ForumQuestionCreateRequest,
  ForumQuestionListResponse,
  ForumQuestionResponse,
} from '../models/forum.model';

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/foro';

  private readonly questionsSignal = signal<ForumQuestionListResponse[]>([]);
  private readonly selectedQuestionSignal = signal<ForumQuestionResponse | null>(
    null,
  );

  readonly questions = computed(() =>
    [...this.questionsSignal()].sort(
      (a, b) =>
        new Date(b.fechaActualizacion).getTime() -
        new Date(a.fechaActualizacion).getTime(),
    ),
  );

  readonly selectedQuestion = this.selectedQuestionSignal.asReadonly();

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly detailLoading = signal(false);
  readonly detailError = signal<string | null>(null);

  loadQuestions(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<ForumQuestionListResponse[]>(this.apiUrl).subscribe({
      next: (questions) => {
        this.questionsSignal.set(questions ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.questionsSignal.set([]);
        this.error.set('No se han podido cargar las preguntas del foro.');
        this.loading.set(false);
      },
    });
  }

  loadQuestionById(id: number): void {
    this.detailLoading.set(true);
    this.detailError.set(null);
    this.selectedQuestionSignal.set(null);

    this.http.get<ForumQuestionResponse>(`${this.apiUrl}/${id}`).subscribe({
      next: (question) => {
        this.selectedQuestionSignal.set(question);
        this.detailLoading.set(false);
      },
      error: () => {
        this.detailError.set('No se ha podido cargar la pregunta del foro.');
        this.detailLoading.set(false);
      },
    });
  }

  createQuestion(
    request: ForumQuestionCreateRequest,
  ): Observable<ForumQuestionResponse> {
    return this.http.post<ForumQuestionResponse>(this.apiUrl, request).pipe(
      tap(() => {
        this.loadQuestions();
      }),
    );
  }

  createAnswer(
    questionId: number,
    request: ForumAnswerCreateRequest,
  ): Observable<ForumAnswerResponse> {
    return this.http
      .post<ForumAnswerResponse>(`${this.apiUrl}/${questionId}`, request)
      .pipe(
        tap(() => {
          this.loadQuestionById(questionId);
          this.loadQuestions();
        }),
      );
  }

  clearSelectedQuestion(): void {
    this.selectedQuestionSignal.set(null);
    this.detailError.set(null);
  }
}