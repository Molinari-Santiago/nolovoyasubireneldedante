'use client';

import { memo } from 'react';
import { MesaCard } from './MesaCard';
import type { Mesa } from '@/types/mesa';

interface ZonaFloorSectionProps {
  zona: string;
  mesas: Mesa[];
  mesasSeleccionadas: string[];
  onSingleClick: (id: string) => void;
  onDoubleClick: (mesa: Mesa) => void;
  onDelete: (id: string) => void;
}

/**
 * ZonaFloorSection — Panel de zona con estética de plano de planta.
 * Simula una "sala" del restaurante con borde punteado y etiqueta arquitectónica.
 */
export const ZonaFloorSection = memo(function ZonaFloorSection({
  zona,
  mesas,
  mesasSeleccionadas,
  onSingleClick,
  onDoubleClick,
  onDelete,
}: ZonaFloorSectionProps) {
  const ocupadas = mesas.filter((m) => m.estado !== 'libre').length;

  return (
    <div className="relative bg-zinc-900/50 border border-zinc-700/40 border-dashed rounded-2xl p-6 min-h-[220px] flex flex-col gap-5">
      {/* Encabezado de zona — estilo etiqueta de plano arquitectónico */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Indicador de sala */}
          <span className="block w-3 h-3 border border-zinc-600 rotate-45 flex-shrink-0" />
          <h3 className="text-xs font-semibold tracking-[0.25em] uppercase text-zinc-500">
            {zona}
          </h3>
        </div>

        {/* Contador de ocupadas */}
        <span
          className={`text-xs font-mono px-2 py-0.5 rounded border ${
            ocupadas > 0
              ? 'text-zinc-300 border-zinc-600 bg-zinc-800/60'
              : 'text-zinc-600 border-zinc-800 bg-transparent'
          }`}
        >
          {ocupadas}/{mesas.length}
        </span>
      </div>

      {/* Grid de mesas */}
      {mesas.length > 0 ? (
        <div className="flex flex-wrap gap-6 justify-start">
          {mesas.map((mesa) => (
            <MesaCard
              key={mesa.id}
              mesa={mesa}
              isSelected={mesasSeleccionadas.includes(mesa.id)}
              onSingleClick={onSingleClick}
              onDoubleClick={onDoubleClick}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        /* Sala vacía — aspecto de sala sin mobiliario */
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-zinc-700 tracking-widest uppercase font-mono">
            — sala vacía —
          </p>
        </div>
      )}

      {/* Línea de escala decorativa — estilo plano arquitectónico */}
      <div className="absolute bottom-3 left-6 flex items-center gap-1 opacity-20 pointer-events-none">
        <div className="w-8 h-px bg-zinc-500" />
        <span className="text-[9px] text-zinc-500 font-mono tracking-widest">ZONA</span>
        <div className="w-8 h-px bg-zinc-500" />
      </div>
    </div>
  );
});
