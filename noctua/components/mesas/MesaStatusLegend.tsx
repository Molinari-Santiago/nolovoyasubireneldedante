'use client';

import { DotBadge } from '@/components/ui/Badge';
import { COLORES_ESTADO_MESA, TEXTO_ESTADO_MESA } from '@/hooks/lib/constants';
import type { EstadoMesa } from '@/types/mesa';

const ESTADOS_LEYENDA: EstadoMesa[] = [
  'libre',
  'ocupada',
  'esperando_pedido',
  'pedido_listo',
  'esperando_pago',
  'problema',
];

/**
 * MesaStatusLegend — Leyenda de estados de mesa, posición fija bottom-right.
 * Extraída de page.tsx para mantener la página limpia.
 */
export function MesaStatusLegend() {
  return (
    <div className="fixed bottom-6 right-6 w-[280px] bg-[#0a0a0a] border border-zinc-800/60 rounded-xl p-4 shadow-2xl z-20 backdrop-blur-sm">
      <p className="text-xs font-semibold text-zinc-500 tracking-widest uppercase mb-3">
        Estados
      </p>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {ESTADOS_LEYENDA.map((estado) => (
          <DotBadge
            key={estado}
            color={COLORES_ESTADO_MESA[estado]}
            label={TEXTO_ESTADO_MESA[estado]}
            className="whitespace-nowrap"
          />
        ))}
      </div>

      <p className="text-zinc-700 text-xs mt-4 font-mono leading-relaxed">
        Click = seleccionar
        <br />
        2× click = gestionar
      </p>
    </div>
  );
}
