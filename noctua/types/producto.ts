export interface Categoria {
  id: string;
  nombre: string;
}

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria_id: string;
  categoria?: Categoria;
  stock?: number;
  disponible: boolean;
}
