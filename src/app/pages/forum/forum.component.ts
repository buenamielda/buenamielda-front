import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ForumService } from '../../services/forum.service';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink, MatIconModule],
  templateUrl: './forum.component.html',
  styleUrl: './forum.component.scss',
})
export class ForumComponent implements OnInit {
  private readonly forumService = inject(ForumService);

  readonly questions = this.forumService.questions;
  readonly loading = this.forumService.loading;
  readonly error = this.forumService.error;

  readonly search = signal('');

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

  readonly totalAnswers = computed(() =>
    this.questions().reduce(
      (total, question) => total + question.totalRespuestas,
      0,
    ),
  );

  ngOnInit(): void {
    this.forumService.loadQuestions();
  }

  updateSearch(value: string): void {
    this.search.set(value);
  }

  formatStatus(status: string): string {
    return status === 'PUBLICADA' ? 'Publicada' : 'Eliminada';
  }
}