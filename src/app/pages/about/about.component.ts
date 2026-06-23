import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  readonly productValues = [
    {
      icon: 'spa',
      title: 'Natural',
      text: 'Productos que respetan su origen, temporada y características propias.',
    },
    {
      icon: 'hive',
      title: 'Cuidado artesanal',
      text: 'Trabajo cercano con las colmenas y atención a cada parte del proceso.',
    },
    {
      icon: 'menu_book',
      title: 'Divulgación',
      text: 'Información clara para conocer mejor la miel, las abejas y su entorno.',
    },
  ];
}
