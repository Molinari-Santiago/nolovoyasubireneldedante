import { Banknote, CreditCard, Wallet } from 'lucide-react';
import type { MetodoPagoFactura, TipoComprobante } from '@/services/facturasService';

export const TIPOS_COMPROBANTE: {
  codigo: TipoComprobante;
  nombre: string;
}[] = [
  { codigo: 1, nombre: 'Factura A' },
  { codigo: 6, nombre: 'Factura B' },
  { codigo: 11, nombre: 'Factura C' },
];

export const METODOS_PAGO: {
  value: MetodoPagoFactura;
  label: string;
  icon: typeof Banknote;
}[] = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'billetera_virtual', label: 'Billetera virtual', icon: Wallet },
  { value: 'debito', label: 'Tarjeta débito', icon: CreditCard },
  { value: 'credito', label: 'Tarjeta crédito', icon: CreditCard },
];

export const BILLETERAS = [
  'Mercado Pago',
  'Ualá',
  'Cuenta DNI',
  'Naranja X',
  'Modo',
  'Otra',
];

export const MARCAS_TARJETA = [
  'Visa',
  'Mastercard',
  'American Express',
  'Maestro',
  'Cabal',
  'Otra',
];

export function formatearARS(valor: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(Number(valor || 0));
}
