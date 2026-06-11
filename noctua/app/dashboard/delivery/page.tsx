"use client";

import { motion } from 'framer-motion';
import { PlatformCard } from '@/components/delivery/PlatformCard';
import { useDeliveryStore } from '@/store/deliveryStore';
import type { PlatformId } from '@/types';

const platforms: { id: PlatformId; displayName: string; color: string }[] = [
  { id: 'pedidosya', displayName: 'PedidosYa', color: '#FF0F50' },
  { id: 'rappi', displayName: 'Rappi', color: '#FF441F' },
  { id: 'glovo', displayName: 'Glovo', color: '#FFC244' },
  { id: 'ubereats', displayName: 'Uber Eats', color: '#06C167' }
];

export default function DeliveryPage() {
  const { getPendingCount, ordersByPlatform } = useDeliveryStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Delivery</h1>
        <p className="text-[#676b67] text-sm">Gestiona pedidos de todas las plataformas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform, index) => (
          <motion.div
            key={platform.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <PlatformCard
              platform={platform.id}
              displayName={platform.displayName}
              color={platform.color}
              pendingCount={getPendingCount(platform.id)}
              lastOrderTime={ordersByPlatform[platform.id][0]?.createdAt}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
