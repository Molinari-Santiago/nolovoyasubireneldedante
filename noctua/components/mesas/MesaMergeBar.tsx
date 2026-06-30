// Barra fija inferior que aparece en modo fusión para confirmar o cancelar la unión de mesas.
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Link2, X, ChevronRight } from 'lucide-react';

interface MesaMergeBarProps {
  originNumero:   number;
  selectedNums:   number[];
  maxReached:     boolean;
  onConfirm:      () => void;
  onCancel:       () => void;
  isLoading?:     boolean;
}

export const MesaMergeBar = memo(function MesaMergeBar({
  originNumero,
  selectedNums,
  maxReached,
  onConfirm,
  onCancel,
  isLoading = false,
}: MesaMergeBarProps) {
  const canConfirm = selectedNums.length >= 2 && !isLoading;
  const otherNums  = selectedNums.filter((n) => n !== originNumero);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="fixed bottom-0 left-0 right-0 z-[9996] border-t border-amber-600/30"
      style={{
        background:           'rgba(8,8,8,0.97)',
        backdropFilter:       'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      {/* Vista de mesas seleccionadas */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-2 flex-wrap">
        {/* Mesa origen */}
        <div className="flex items-center gap-1.5 bg-amber-600/20 border border-amber-500/40 rounded-lg px-3 py-1.5">
          <span className="text-amber-400 text-xs font-semibold uppercase tracking-widest">Principal</span>
          <span className="text-white font-black text-base leading-none">{originNumero}</span>
        </div>

        {otherNums.length > 0 && (
          <>
            <Link2 size={14} className="text-zinc-600 flex-shrink-0" />
            {otherNums.map((num) => (
              <div
                key={num}
                className="flex items-center gap-1 bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-1.5"
              >
                <span className="text-zinc-300 font-black text-base leading-none">{num}</span>
              </div>
            ))}
          </>
        )}

        {otherNums.length === 0 && (
          <div className="flex items-center gap-1.5 text-zinc-600 text-xs animate-pulse">
            <ChevronRight size={13} />
            <span>Tocá otra mesa para agregarla al grupo</span>
          </div>
        )}

        {maxReached && (
          <span className="text-amber-500 text-[10px] font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full ml-auto">
            Máx. 4 mesas
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 px-4 pb-4 pt-2">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-5 py-2.5 text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-xl text-sm font-medium transition-colors min-h-[48px] flex-1"
        >
          <X size={15} />
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={!canConfirm}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all min-h-[48px] flex-[2]
            ${canConfirm
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/40'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
        >
          <Link2 size={15} />
          {isLoading ? 'Uniendo...' : `Unir ${selectedNums.length} mesas`}
        </button>
      </div>
    </motion.div>
  );
});
