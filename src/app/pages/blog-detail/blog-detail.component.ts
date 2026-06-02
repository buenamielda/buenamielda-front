import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { BlogService } from '../../services/blog.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, DatePipe],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blogService = inject(BlogService);
  private readonly authService = inject(AuthService);

  readonly entrada = this.blogService.entradaDetalle;
  readonly cargando = this.blogService.cargandoDetalle;
  readonly error = this.blogService.errorDetalle;
  readonly puedeEditarEntradas = computed(
    () =>
      this.authService.hasActiveSession() &&
      (this.authService.hasRole('DIVULGATIVO') || this.authService.isAdmin()),
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || Number.isNaN(id)) {
      this.router.navigate(['/blog']);
      return;
    }

    this.blogService.cargarEntradaPorId(id);
  }
}