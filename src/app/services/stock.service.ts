import { Injectable, inject } from '@angular/core';

import {
  ActualizarStockRequestDto,
  ProductoStockResponseDto,
} from '../models/stock.model';
import { LineaPedidoResponseDto } from '../models/order.model';
import { OrderNotFoundError, OrderService } from './order.service';
import { ProductCatalogService } from './product-catalog.service';

export class StockProductNotFoundError extends Error {
  constructor(productName: string) {
    super(`No se ha encontrado el producto "${productName}".`);
  }
}

export class StockWouldBeNegativeError extends Error {
  constructor(productName: string) {
    super(`El stock de "${productName}" no puede quedar por debajo de cero.`);
  }
}

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly orderService = inject(OrderService);
  private readonly productCatalog = inject(ProductCatalogService);

  updateStockForOrder(
    request: ActualizarStockRequestDto,
  ): ProductoStockResponseDto[] {
    const order = this.orderService.getById(request.idPedido);

    if (!order) {
      throw new OrderNotFoundError();
    }

    return this.updateStockForLines(order.lineas);
  }

  updateStockForLines(
    lineas: LineaPedidoResponseDto[],
  ): ProductoStockResponseDto[] {
    const updatedProducts = lineas.map((line) => {
      const product = this.productCatalog.obtenerPorId(line.idProducto);

      if (!product) {
        throw new StockProductNotFoundError(line.nombreProducto);
      }

      const nextStock = product.stock - line.cantidad;

      if (nextStock < 0) {
        throw new StockWouldBeNegativeError(product.nombre);
      }

      return {
        product,
        line,
        nextStock,
      };
    });

    console.log(
      '[Stock actualizado]',
      updatedProducts.map(({ product, line, nextStock }) => ({
        idProducto: product.id,
        nombre: product.nombre,
        stockAnterior: product.stock,
        cantidadDescontada: line.cantidad,
        stockNuevo: nextStock,
      })),
    );

    updatedProducts.forEach(({ product, nextStock }) => {
      this.productCatalog.actualizarStockLocal(product.id, nextStock);
    });

    return updatedProducts.map(({ product, nextStock }) => ({
      idProducto: product.id,
      nombre: product.nombre,
      stock: nextStock,
      activo: product.activo,
    }));
  }
}
