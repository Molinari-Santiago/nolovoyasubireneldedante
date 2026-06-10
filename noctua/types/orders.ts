import type { PlatformId } from './platforms';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  externalId: string;
  platform: PlatformId;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  customer: { name: string; phone?: string; address?: string };
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentMethod: 'online' | 'cash' | 'card';
  estimatedDelivery?: Date;
  notes?: string;
}
