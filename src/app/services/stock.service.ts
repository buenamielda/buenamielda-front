import { Injectable, inject } from '@angular/core';

import { LineaPedidoResponseDto } from '../models/order.model';
import {
  ListadoStockResponseDto,
  ProductoStockResponseDto,
  ValidarStockRequestDto,
  ValidarStockResponseDto,
} from '../models/stock.model';
import { ProductCatalogService } from './product-catalog.service';
import { Producto } from '../models/product.model';

export class StockProductNotFoundError extends Error {
  constructor(productName: string) {
    super(`No se ha encontrado el producto "${productName}".`);
  }
}

export class InactiveStockProductError extends Error {
  constructor(productName: string) {
    super(`El producto "${productName}" no esta activo.`);
  }
}

export class InsufficientStockError extends Error {
  constructor(productName: string) {
    super(`No hay stock suficiente para "${productName}".`);
  }
}

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private readonly productCatalog = inject(ProductCatalogService);

  getAllProductStocks(): ListadoStockResponseDto {
    return {
      productos: this.productCatalog
        .todosLosProductos()
        .map((producto) => this.toStockResponse(producto)),
    };
  }

  getProductStockById(idProducto: number): ProductoStockResponseDto {
    const producto = this.productCatalog.obtenerPorId(idProducto);

    if (!producto) {
      throw new StockProductNotFoundError(`ID ${idProducto}`);
    }

    return this.toStockResponse(producto);
  }

  validateStock(request: ValidarStockRequestDto): ValidarStockResponseDto {
    const product = this.productCatalog.obtenerPorId(request.idProducto);

    if (!product) {
      throw new StockProductNotFoundError(`ID ${request.idProducto}`);
    }

    const disponible =
      product.activo &&
      product.stock > 0 &&
      request.cantidadSolicitada > 0 &&
      product.stock >= request.cantidadSolicitada;

    return {
      idProducto: product.id,
      nombreProducto: product.nombre,
      stockDisponible: product.stock,
      cantidadSolicitada: request.cantidadSolicitada,
      disponible,
    };
  }

  assertStockAvailable(
    idProducto: number,
    cantidadSolicitada: number,
  ): ValidarStockResponseDto {
    const response = this.validateStock({
      idProducto,
      cantidadSolicitada,
    });

    if (!response.disponible) {
      const product = this.productCatalog.obtenerPorId(idProducto);

      if (!product?.activo) {
        throw new InactiveStockProductError(response.nombreProducto);
      }

      throw new InsufficientStockError(response.nombreProducto);
    }

    return response;
  }

  updateStockForLines(
    lineas: LineaPedidoResponseDto[],
  ): ProductoStockResponseDto[] {
    const updatedProducts = lineas.map((line) => {
      const product = this.productCatalog.obtenerPorId(line.idProducto);

      if (!product) {
        throw new StockProductNotFoundError(line.nombreProducto);
      }

      this.assertStockAvailable(line.idProducto, line.cantidad);

      return {
        product,
        nextStock: product.stock - line.cantidad,
      };
    });

    updatedProducts.forEach(({ product, nextStock }) => {
      this.productCatalog.actualizarStockLocal(product.id, nextStock);
    });
    return updatedProducts.map(({ product, nextStock }) => ({
      idProducto: product.id,
      nombre: product.nombre,
      precio: product.precio,
      stock: nextStock,
      activo: product.activo,
    }));
  }

  private toStockResponse(producto: Producto): ProductoStockResponseDto {
    return {
      idProducto: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
      activo: producto.activo,
    };
  }
}
