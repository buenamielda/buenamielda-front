import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductCatalogService {
  private readonly productList = signal<Product[]>([
    {
      id: 1,
      name: 'Miel de Tomillo Abuelo Rustico',
      price: 9.99,
      image: 'assets/images/miel-tomillo.svg',
      category: 'miel',
      netWeight: '1 Kg',
      description:
        'Miel pura de primera calidad, obtenida de colmenas locales y producida de manera artesanal.',
      details: [
        'Origen: Ingredientes 100% naturales recolectados en zonas ecologicamente sostenibles.',
        'Sabor y aroma: Intensidad y fragancia natural, con notas florales propias de la flora local.',
        'Envase: Tarro de cristal con cierre hermetico.',
        'Peso neto: 1 Kg.',
      ],
    },
    { id: 2, name: 'Miel de Mil Flores', price: 9.99, image: 'assets/images/miel-mil-flores.svg', category: 'miel' },
    { id: 3, name: 'Miel de Montana', price: 9.99, image: 'assets/images/miel-montana.svg', category: 'miel' },
    { id: 4, name: 'Miel de Lavanda', price: 9.99, image: 'assets/images/miel-lavanda.svg', category: 'miel' },
    { id: 5, name: 'Miel del Bosque', price: 9.99, image: 'assets/images/miel-bosque.svg', category: 'miel' },
    { id: 6, name: 'Miel de Azahar', price: 9.99, image: 'assets/images/miel-azahar.svg', category: 'miel' },
    { id: 7, name: 'Miel de Eucalipto', price: 9.99, image: 'assets/images/miel-eucalipto.svg', category: 'miel' },
    { id: 8, name: 'Polen natural', price: 12.5, image: 'assets/images/polen-natural.svg', category: 'polen' },
  ]);

  readonly products = this.productList.asReadonly();

  getById(id: number): Product | undefined {
    return this.productList().find((product) => product.id === id);
  }
}