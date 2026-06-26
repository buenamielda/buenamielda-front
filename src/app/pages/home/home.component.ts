import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HeroComponent } from '../../shared/hero/hero.component';
import { ProductGridComponent } from '../../shared/product/product.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    HeroComponent,
    ProductGridComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  benefits = [
    {
      icon: 'eco',
      title: 'Miel natural',
      text: 'Productos apícolas seleccionados con cuidado, sin perder el sabor propio de cada floración.',
    },
    {
      icon: 'science',
      title: 'Divulgación cercana',
      text: 'Contenido claro sobre abejas, colmenas y procesos para entender mejor lo que llega a tu mesa.',
    },
    {
      icon: 'local_shipping',
      title: 'Del colmenar a casa',
      text: 'Una experiencia de compra sencilla para descubrir, elegir y recibir productos apícolas de calidad.',
    },
  ];

  testimonials = [
    {
      quote:
        'Una miel con sabor auténtico y una web que explica muy bien de dónde viene cada producto.',
      author: 'Cliente verificado',
    },
    {
      quote:
        'Me gusta que combine tienda y aprendizaje. Se nota el cuidado por el producto y por las abejas.',
      author: 'Amante de la apicultura',
    },
    {
      quote:
        'El catalogo es claro y la identidad visual transmite naturaleza, cercanía y oficio artesanal.',
      author: 'Usuario del prototipo',
    },
  ];

  popularLinks = [
    { label: 'Productos', route: '/productos' },
    { label: 'Blog educativo', route: '/blog' },
    { label: 'Foro', route: '/foro' },
  ];
}