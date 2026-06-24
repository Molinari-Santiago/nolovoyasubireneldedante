'use client';

import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Archive, CheckCircle, ChefHat, Play } from 'lucide-react';
import { usePedidosStore } from '@/store/pedidosStore';
import { useSuperAdmStore } from '@/store/superadmStore';
import { cocinaService } from '@/services/cocinaService';
import { KDS_TIMER_GREEN_MINUTES, KDS_TIMER_YELLOW_MINUTES } from '@/hooks/lib/constants';
import { elapsedMinutes, formatElapsed, cn } from '@/hooks/lib/utils';
import type { Pedido } from '@/types/pedido';

// ── KDS Timer ──────────────────────────────────────────────────────────────────

function KDSTimer({ creadoEn }: { creadoEn: Date }) {
  const [elapsed, setElapsed] = useState('');
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    const tick = () => {
      setElapsed(formatElapsed(creadoEn));
      setMinutes(elapsedMinutes(creadoEn));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [creadoEn]);

  const colorClass =
    minutes >= KDS_TIMER_YELLOW_MINUTES
      ? 'text-red-400'
      : minutes >= KDS_TIMER_GREEN_MINUTES
      ? 'text-yellow-400'
      : 'text-green-400';

  return (
    <div className={cn('flex items-center gap-1.5 font-mono font-bold text-sm', colorClass,
      minutes >= KDS_TIMER_YELLOW_MINUTES && 'animate-pulse-red'
    )}>
      <Clock size={13} />
      {elapsed}
    </div>
  );
}

// ── KDS Card ──────────────────────────────────────────────────────────────────

const ICONOS_ESTADO: Record<string, any> = {
  pendiente: Play,
  preparando: ChefHat,
  listo: CheckCircle,
  entregado: Archive,
};

const PedidoKDSCard = memo(function PedidoKDSCard({
  pedido,
  statuses,
  onCambiarEstado,
}: {
  pedido: Pedido;
  statuses: any[];
  onCambiarEstado: (id: string, nuevoEstado: string) => void;
}) {
  const currentStatus = statuses.find(s => s.name.toLowerCase() === pedido.estado);
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className={cn(
        'bg-[#0d0d0d] border-2 rounded-xl p-4 space-y-3',
        currentStatus ? `border-[${currentStatus.bgColor}]` : 'border-gray-500'
      )}
      style={{ borderColor: currentStatus?.bgColor }}
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-4xl font-black text-white leading-none">
              {pedido.numeroMesa}
            </span>
            <div className="flex items-center gap-1 text-[#676B67] text-xs mt-1">
              <Users size={11} />
              <span>{pedido.personas}</span>
            </div>
          </div>
          <p className="text-[#676B67] text-xs mt-0.5 tracking-wide">{pedido.zona}</p>
        </div>
        <KDSTimer creadoEn={pedido.creadoEn} />
      </div>

      {/* Items */}
      <div className="space-y-1.5" role="list" aria-label="Items del pedido">
        {pedido.items.map((item) => (
          <div key={item.productoId} role="listitem" className="flex items-start gap-2">
            <span className="text-white font-bold text-base leading-tight w-6 flex-shrink-0">
              {item.cantidad}×
            </span>
            <div>
              <p className="text-[#D9D9D9] text-sm font-medium leading-tight">{item.nombre}</p>
              {item.notas && (
                <p className="text-yellow-400 text-xs mt-0.5 font-medium">
                  ⚑ {item.notas}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Select Box for Estado */}
      <div className="pt-2 border-t border-[#1a1a1a]">
        <label className="text-xs text-[#676B67] font-semibold mb-1 block uppercase tracking-widest">
          Modificar Estado
        </label>
        <select
          value={pedido.estado}
          onChange={(e) => onCambiarEstado(pedido.id, e.target.value)}
          className="w-full bg-[#111] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-white transition-colors"
        >
          {statuses.map((status) => {
            const estadoKey = status.name.toLowerCase();
            return (
              <option key={status.id} value={estadoKey}>
                {status.name}
              </option>
            );
          })}
        </select>
      </div>
    </motion.div>
  );
});

// ── KDS Column ────────────────────────────────────────────────────────────────

const KDSColumn = memo(function KDSColumn({
  status,
  pedidos,
  onCambiarEstado,
}: {
  status: any;
  pedidos: Pedido[];
  onCambiarEstado: (id: string, nuevoEstado: string) => void;
}) {
  const estadoKey = status.name.toLowerCase();
  return (
    <div className="flex flex-col bg-[#060606] border border-[#111] rounded-xl overflow-hidden">
      <div 
        className="px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: status.bgColor, color: status.color }}
      >
        <span className="font-display text-xl tracking-widest font-black uppercase">
          {status.name}
        </span>
        <span className="text-sm font-black opacity-80">{pedidos.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <AnimatePresence mode="popLayout">
          {pedidos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-32 text-[#2a2a2a] text-sm"
            >
              Sin pedidos
            </motion.div>
          ) : (
            pedidos.map((pedido) => (
              <PedidoKDSCard 
                key={pedido.id} 
                pedido={pedido}
                statuses={[status]}
                onCambiarEstado={onCambiarEstado} 
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CocinaPage() {
  const pedidos = usePedidosStore((s) => s.pedidos);
  const cargarPedidos = usePedidosStore((s) => s.cargarPedidos);
  const { config, initializeConfig } = useSuperAdmStore();

  useEffect(() => {
    initializeConfig();
    cargarPedidos();
  }, [cargarPedidos, initializeConfig]);

  const handleCambiarEstado = async (pedidoId: string, nuevoEstado: string) => {
    await cocinaService.cambiarEstadoLibre(pedidoId, nuevoEstado as any);
  };

  const getPedidosPorEstado = (estadoName: string) =>
    pedidos.filter((p) => p.estado === estadoName.toLowerCase());

  const sortedStatuses = [...config.kitchenStatuses].sort((a, b) => a.order - b.order);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 overflow-hidden">
        {sortedStatuses.map((status) => (
          <KDSColumn
            key={status.id}
            status={status}
            pedidos={getPedidosPorEstado(status.name)}
            onCambiarEstado={handleCambiarEstado}
          />
        ))}
      </div>
    </div>
  );
}
