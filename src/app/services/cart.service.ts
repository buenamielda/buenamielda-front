import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { Producto } from '../models/product.model';
import { ProductCatalogService } from './product-catalog.service';

export type PurchaseMode = 'single' | 'subscription';

export interface CartItem {
  lineId?: number;
  product: Producto;
  quantity: number;
  purchaseMode: PurchaseMode;
}

interface CarritoLineaResponseDto {
  id: number;
  cantidad: number;
  idProducto: number;
  nombreProducto: string;
  precioProducto: number;
  subtotal: number;
}

interface CarritoResponseDto {
  id: number;
  fechaCreacion: string;
  fechaModificacion: string;
  estado: string;
  idUsuario: number;
  nombreUsuario: string;
  lineas: CarritoLineaResponseDto[];
  total: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly productCatalog = inject(ProductCatalogService);
  private readonly apiUrl = '/api/carrito';

  private readonly cartItems = signal<CartItem[]>([]);

  readonly items = this.cartItems.asReadonly();

  readonly itemCount = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0),
  );

  readonly subtotal = computed(() =>
    this.cartItems().reduce(
      (total, item) => total + item.product.precio * item.quantity,
      0,
    ),
  );

  loadCart(): Observable<CarritoResponseDto | null> {
    return this.http.get<CarritoResponseDto | null>(this.apiUrl).pipe(
      tap((carrito) => {
        if (!carrito) {
          this.cartItems.set([]);
          return;
        }

        this.syncFromApi(carrito);
      }),
    );
  }

  verifyCart(): Observable<void> {
    return this.http.get<void>(`${this.apiUrl}/verificar`);
  }

  add(
    product: Producto,
    quantity = 1,
    purchaseMode: PurchaseMode = 'single',
  ): Observable<CarritoResponseDto> {
    const body = {
      idProducto: product.id,
      cantidad: quantity,
    };

    return this.http.post<CarritoResponseDto>(`${this.apiUrl}/lineas`, body).pipe(
      tap((carrito) => {
        this.syncFromApi(carrito, product, purchaseMode);
      }),
    );
  }

  increase(item: CartItem): Observable<CarritoResponseDto> {
    return this.updateLine(item, item.quantity + 1);
  }

  decrease(item: CartItem): Observable<CarritoResponseDto> {
    return this.updateLine(item, item.quantity - 1);
  }

  remove(item: CartItem): Observable<void> {
    if (!item.lineId) {
      this.removeLocal(item.product.id, item.purchaseMode);

      return new Observable<void>((observer) => {
        observer.next();
        observer.complete();
      });
    }

    return this.http.delete<void>(`${this.apiUrl}/lineas/${item.lineId}`).pipe(
      tap(() => {
        this.removeLocal(item.product.id, item.purchaseMode);
      }),
    );
  }

  clear(): void {
    this.cartItems.set([]);
  }

  private updateLine(
    item: CartItem,
    quantity: number,
  ): Observable<CarritoResponseDto> {
    if (quantity <= 0) {
      return new Observable<CarritoResponseDto>((observer) => {
        this.remove(item).subscribe({
          next: () => {
            observer.next({
              id: 0,
              fechaCreacion: '',
              fechaModificacion: '',
              estado: 'Activo',
              idUsuario: 0,
              nombreUsuario: '',
              lineas: [],
              total: 0,
            });
            observer.complete();
          },
          error: (error) => observer.error(error),
        });
      });
    }

    if (!item.lineId) {
      return this.add(item.product, 1, item.purchaseMode);
    }

    return this.http
      .put<CarritoResponseDto>(`${this.apiUrl}/lineas/${item.lineId}`, {
        cantidad: quantity,
      })
      .pipe(
        tap((carrito) => {
          this.syncFromApi(carrito);
        }),
      );
  }

  private syncFromApi(
    carrito: CarritoResponseDto,
    changedProduct?: Producto,
    purchaseMode: PurchaseMode = 'single',
  ): void {
    this.cartItems.set(
      carrito.lineas.map((linea) => {
        const existing = this.cartItems().find(
          (item) => item.product.id === linea.idProducto,
        );

        const catalogProduct = this.productCatalog.obtenerPorId(
          linea.idProducto,
        );

        const product =
          existing?.product ??
          catalogProduct ??
          (changedProduct?.id === linea.idProducto
            ? changedProduct
            : this.createProductFromCartLine(linea));

        return {
          lineId: linea.id,
          quantity: linea.cantidad,
          purchaseMode: existing?.purchaseMode ?? purchaseMode,
          product,
        };
      }),
    );
  }

  private createProductFromCartLine(
    linea: CarritoLineaResponseDto,
  ): Producto {
    return {
      id: linea.idProducto,
      nombre: linea.nombreProducto,
      descripcion: '',
      precio: linea.precioProducto,
      stock: 0,
      imagenUrl: 'assets/images/placeholder.svg',
      activo: true,
      nombreCategoria: '',
    };
  }

  private removeLocal(productId: number, purchaseMode: PurchaseMode): void {
    this.cartItems.update((items) =>
      items.filter(
        (item) =>
          item.product.id !== productId || item.purchaseMode !== purchaseMode,
      ),
    );
  }
}