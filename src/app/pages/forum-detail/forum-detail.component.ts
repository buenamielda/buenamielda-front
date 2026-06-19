import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ForumService } from '../../services/forum.service';

@Component({
  selector: 'app-forum-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, MatIconModule],
  templateUrl: './forum-detail.component.html',
  styleUrl: './forum-detail.component.scss',
})
export class ForumDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly forumService = inject(ForumService);

  readonly question = this.forumService.selectedQuestion;
  readonly loading = this.forumService.detailLoading;
  readonly error = this.forumService.detailError;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isFinite(id) || id <= 0) {
      this.router.navigate(['/foro']);
      return;
    }

    this.forumService.loadQuestionById(id);
  }

  ngOnDestroy(): void {
    this.forumService.clearSelectedQuestion();
  }
}