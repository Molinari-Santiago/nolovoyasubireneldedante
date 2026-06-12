'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Clock, AlertTriangle, Users } from 'lucide-react';
import { MesaShape } from './MesaShape';
import { MesaChairs } from './MesaChairs';
import { MESA_ESTADO_HEX, getFormaVisual } from './mesaEstadoColors';
import { TEXTO_ESTADO_MESA } from '@/hooks/lib/constants';
import { formatElapsed, elapsedMinutes, cn } from '@/hooks/lib/utils';
import type { Mesa } from '@/types/mesa';

interface MesaCardProps {
  mesa: Mesa;
  isSelected: boolean;
  onSingleClick: (id: string) => void;
  onDoubleClick: (mesa: Mesa) => void;
  onDelete: (id: string) => void;
}

/** Dimensiones del contenedor de sillas según forma visual */
function getContenedorSize(capacidad: number): { w: number; h: number } {
  const forma = getFormaVisual(capacidad);
  return forma === 'rectangular' ? { w: 200, h: 160 } : { w: 160, h: 160 };
}

export const MesaCard = memo(function MesaCard({
  mesa,
  isSelected,
  onSingleClick,
  onDoubleClick,
  onDelete,
}: MesaCardProps) {
  const [elapsed, setElapsed]   = useState('');
  const [isOverdue, setIsOverdue] = useState(false);
  const [hovered, setHovered]   = useState(false);
  const clickTimerRef           = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer de tiempo transcurrido
  useEffect(() => {
    if (!mesa.timerInicio) { setElapsed(''); return; }
    const tick = () => {
      setElapsed(formatElapsed(mesa.timerInicio!));
      setIsOverdue(elapsedMinutes(mesa.timerInicio!) >= 90);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [mesa.timerInicio]);

  const handleClick = () => {
    if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; return; }
    clickTimerRef.current = setTimeout(() => { onSingleClick(mesa.id); clickTimerRef.current = null; }, 200);
  };

  const handleDoubleClick = () => {
    if (clickTimerRef.current) { clearTimeout(clickTimerRef.current); clickTimerRef.current = null; }
    onDoubleClick(mesa);
  };

  const { w, h } = getContenedorSize(mesa.capacidad);
  const forma     = getFormaVisual(mesa.capacidad);
  const glowColor = MESA_ESTADO_HEX[mesa.estado];
  const filterId  = `glow-${mesa.id}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className="flex flex-col items-center gap-2 select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Contenedor principal de mesa + sillas */}
      <div
        role="button"
        aria-label={`Mesa ${mesa.numero}, ${TEXTO_ESTADO_MESA[mesa.estado]}${mesa.personas ? `, ${mesa.personas} personas` : ''}`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={cn(
          'relative cursor-pointer rounded-xl transition-all duration-200',
          isSelected && 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950'
        )}
        style={{ width: w, height: h }}
      >
        {/* SVG de sillas (absoluto, debajo visualmente) */}
        <MesaChairs capacidad={mesa.capacidad} estado={mesa.estado} />

        {/* SVG de la mesa (centrado sobre las sillas) */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ pointerEvents: 'none' }}
        >
          <MesaShape capacidad={mesa.capacidad} estado={mesa.estado} filterId={filterId} />
        </div>

        {/* Número de mesa — superpuesto al centro */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="font-black text-white leading-none drop-shadow-lg select-none"
            style={{
              fontSize: forma === 'circular' ? '1.6rem' : '1.75rem',
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
            }}
          >
            {mesa.numero}
          </span>
        </div>

        {/* Personas (si aplica) */}
        {mesa.personas && mesa.personas > 0 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-0.5 pointer-events-none">
            <Users size={9} className="text-white/70" />
            <span className="text-[10px] font-semibold text-white/70">{mesa.personas}</span>
          </div>
        )}

        {/* Botón eliminar — solo en hover, top-right */}
        <AnimatePresence>
          {hovered && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => { e.stopPropagation(); onDelete(mesa.id); }}
              className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-10 transition-colors"
              aria-label={`Eliminar mesa ${mesa.numero}`}
            >
              <Trash2 size={11} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Icono de alerta si hay problema */}
        {mesa.estado === 'problema' && (
          <div className="absolute -top-1 -left-1 bg-red-500 rounded-full p-0.5 z-10">
            <AlertTriangle size={10} className="text-white" />
          </div>
        )}

        {/* Indicador de mesas unidas */}
        {mesa.mesasUnidas && mesa.mesasUnidas.length > 0 && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center z-10">
            <span className="text-[8px] text-white font-bold">{mesa.mesasUnidas.length + 1}</span>
          </div>
        )}

        {/* Tooltip en hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
            >
              <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: glowColor }}
                  />
                  <span className="text-[11px] font-semibold text-white">
                    Mesa {mesa.numero}
                  </span>
                  <span className="text-[10px] text-zinc-400">·</span>
                  <span className="text-[10px] text-zinc-400">{mesa.capacidad} pers.</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5 text-center">
                  {TEXTO_ESTADO_MESA[mesa.estado]}
                </p>
              </div>
              {/* Flechita del tooltip */}
              <div className="w-2 h-2 bg-zinc-900 border-r border-b border-zinc-700 mx-auto rotate-45 -mt-1" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timer — debajo del contenedor (no dentro del SVG) */}
      {elapsed && (
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold',
            isOverdue
              ? 'bg-red-500/20 text-red-400 animate-pulse'
              : 'bg-zinc-800/60 text-zinc-400'
          )}
        >
          <Clock size={9} />
          <span>{elapsed}</span>
        </div>
      )}
    </motion.div>
  );
});