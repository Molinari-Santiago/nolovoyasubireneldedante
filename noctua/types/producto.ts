export type CategoriaProducto = 'cafeteria' | 'restaurante' | 'bebidas' | 'combos';

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria: CategoriaProducto;
  stock?: number;
  disponible: boolean;
}
