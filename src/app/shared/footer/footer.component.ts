import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDividerModule, MatIconModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  year = new Date().getFullYear();

  columns = [
    {
      title: 'Descubre',
      links: [
        { label: 'Blog educativo', route: '/blog' },
        { label: 'Más buscado',        route: 'info/mas-buscado' },
        { label: 'Mejores ventas',     route: 'info/mejores-ventas' },
      ],
    },
    {
      title: 'Sobre nosotros',
      links: [
        { label: 'Ayuda',       route: 'info/ayuda' },
        { label: 'Pedidos',     route: '/pedidos' },
        { label: 'Suscríbete',  route: 'info/suscribete' },
      ],
    },
    {
      title: 'Información',
      links: [
        { label: 'Contáctanos',            route: '/contacto' },
        { label: 'Política de privacidad', route: 'info/privacidad' },
        { label: 'Términos y condiciones', route: 'info/terminos' },
        { label: 'Puntos de venta', route: '/puntos-venta' },
      ],
    },
  ];
}