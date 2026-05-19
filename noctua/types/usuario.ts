export type RolUsuario = 'admin' | 'mozo' | 'cocinero';

export interface Usuario {
  id: string;
  nombre: string;
  rol: RolUsuario;
}
