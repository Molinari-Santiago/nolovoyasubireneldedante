export type RolUsuario = 'admin' | 'mozo' | 'cocina' | 'cajero';

export interface Usuario {
  id: string;
  auth_user_id: string;
  nombre: string;
  username: string;
  rol: RolUsuario;
  activo: boolean;
  created_at: string;
  creado_en?: string;
}
