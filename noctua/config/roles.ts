export type SeccionSistema =
  | 'mesas'
  | 'pedidos'
  | 'cocina'
  | 'cajero'
  | 'historial'
  | 'stock'
  | 'reservas'
  | 'administracion'
  | 'delivery';

export type RolSistema =
  | 'admin'
  | 'cajero'
  | 'cocina'
  | 'mozo'
  | 'stock'
  | 'delivery';

export const SECCIONES_POR_ROL: Record<RolSistema, SeccionSistema[]> = {
  admin: [
    'mesas',
    'pedidos',
    'cocina',
    'cajero',
    'historial',
    'stock',
    'reservas',
    'administracion',
    'delivery',
  ],
  cajero: ['mesas', 'pedidos', 'cajero', 'historial'],
  cocina: ['cocina'],
  mozo: ['mesas', 'pedidos', 'cocina'],
  stock: ['stock'],
  delivery: ['delivery'],
};

export const RUTA_POR_SECCION: Record<SeccionSistema, string> = {
  mesas: '/dashboard/mesas',
  pedidos: '/dashboard/pedido',
  cocina: '/dashboard/cocina',
  cajero: '/dashboard/facturas',
  historial: '/dashboard/historial',
  stock: '/dashboard/stock',
  reservas: '/dashboard/reservas',
  administracion: '/dashboard/administracion',
  delivery: '/delivery',
};

export const LABEL_POR_SECCION: Record<SeccionSistema, string> = {
  mesas: 'Mesas',
  pedidos: 'Pedidos',
  cocina: 'Cocina',
  cajero: 'Facturas',
  historial: 'Historial',
  stock: 'Stock',
  reservas: 'Reservas',
  administracion: 'Administracion',
  delivery: 'Delivery',
};

export const HOME_POR_ROL: Record<RolSistema, string> = {
  admin: '/dashboard/mesas',
  cajero: '/dashboard/facturas',
  cocina: '/dashboard/cocina',
  mozo: '/dashboard/mesas',
  stock: '/dashboard/stock',
  delivery: '/delivery',
};

export function obtenerSeccionesPorRol(rol?: string | null): SeccionSistema[] {
  if (!rol) return SECCIONES_POR_ROL.admin;

  return SECCIONES_POR_ROL[rol as RolSistema] || SECCIONES_POR_ROL.admin;
}

export function puedeAccederASeccion(
  rol: string | null | undefined,
  seccion: SeccionSistema
) {
  return obtenerSeccionesPorRol(rol).includes(seccion);
}
