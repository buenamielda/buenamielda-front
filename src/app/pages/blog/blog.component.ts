import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { BlogService } from '../../services/blog.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, DatePipe],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss',
})
export class BlogComponent implements OnInit {
  private readonly blogService = inject(BlogService);

  readonly entradas = this.blogService.entradas;
  readonly cargando = this.blogService.cargando;
  readonly error = this.blogService.error;

  ngOnInit(): void {
    this.blogService.cargarEntradas();
  }
}