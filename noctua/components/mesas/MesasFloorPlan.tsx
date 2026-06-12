'use client';

import { memo } from 'react';
import { ZonaFloorSection } from './ZonaFloorSection';
import { MesaStatusLegend } from './MesaStatusLegend';
import type { Mesa } from '@/types/mesa';

const ZONAS_LAYOUT = [
  'TERRAZA EXTERIOR',
  'SALÓN PRINCIPAL',
  'BAR',
  'ZONA SOFÁS',
  'ZONA COCINA',
] as const;

interface MesasFloorPlanProps {
  mesas: Mesa[];
  mesasSeleccionadas: string[];
  onSingleClick: (id: string) => void;
  onDoubleClick: (mesa: Mesa) => void;
  onDelete: (id: string) => void;
}

/**
 * MesasFloorPlan — Contenedor principal del plano de planta.
 * Reemplaza la grilla de tarjetas del diseño original.
 * Agrupa las mesas por zona y renderiza un ZonaFloorSection por zona.
 */
export const MesasFloorPlan = memo(function MesasFloorPlan({
  mesas,
  mesasSeleccionadas,
  onSingleClick,
  onDoubleClick,
  onDelete,
}: MesasFloorPlanProps) {
  const getMesasPorZona = (zona: string) =>
    mesas.filter((m) => m.zona === zona);

  // Zonas con mesas + zonas sin mesas (para que todas las salas estén visibles)
  const zonasConMesas    = ZONAS_LAYOUT.filter((z) => getMesasPorZona(z).length > 0);
  const zonasSinMesas    = ZONAS_LAYOUT.filter((z) => getMesasPorZona(z).length === 0);
  // Zonas fuera del layout (por si hay mesas en zonas no definidas)
  const zonasExtraSet    = new Set(ZONAS_LAYOUT as readonly string[]);
  const zonasExtra       = [...new Set(mesas.map((m) => m.zona).filter((z) => !zonasExtraSet.has(z)))];

  const todasLasZonas = [...zonasConMesas, ...zonasExtra, ...zonasSinMesas];

  return (
    <div className="relative">
      {/* Grid de zonas — 2 columnas en desktop, 1 en mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {todasLasZonas.map((zona) => (
          <ZonaFloorSection
            key={zona}
            zona={zona}
            mesas={getMesasPorZona(zona)}
            mesasSeleccionadas={mesasSeleccionadas}
            onSingleClick={onSingleClick}
            onDoubleClick={onDoubleClick}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Leyenda de estados — posición fija */}
      <MesaStatusLegend />
    </div>
  );
});
