import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, DatePipe],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss',
})
export class BlogComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly authService = inject(AuthService);

  readonly entradas = this.blogService.entradas;
  readonly cargando = this.blogService.cargando;
  readonly error = this.blogService.error;
  readonly puedeCrearEntradas = computed(
    () =>
      this.authService.hasActiveSession() &&
      (this.authService.hasRole('DIVULGATIVO') || this.authService.isAdmin()),
  );

  ngOnInit(): void {
    this.blogService.cargarEntradas();
  }
}
