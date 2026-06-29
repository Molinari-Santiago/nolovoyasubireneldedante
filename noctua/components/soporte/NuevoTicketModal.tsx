'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/hooks/lib/utils';
import type { TicketCategoria, CreateTicketPayload } from '@/types/soporte';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTicketPayload) => Promise<boolean>;
  submitting: boolean;
}

type CategoriaOpcion = { value: TicketCategoria; label: string; emoji: string; desc: string };

const CATEGORIAS: CategoriaOpcion[] = [
  { value: 'bug',      label: 'Bug',      emoji: '🐛', desc: 'Algo no funciona' },
  { value: 'consulta', label: 'Consulta', emoji: '💬', desc: 'Tengo una pregunta' },
  { value: 'mejora',   label: 'Mejora',   emoji: '✨', desc: 'Sugerencia de mejora' },
  { value: 'urgente',  label: 'Urgente',  emoji: '🚨', desc: 'Necesita atención ya' },
];

const CATEGORIA_ACTIVE: Record<TicketCategoria, string> = {
  bug:      'border-red-500 bg-red-500/10 text-red-300',
  consulta: 'border-blue-500 bg-blue-500/10 text-blue-300',
  mejora:   'border-purple-500 bg-purple-500/10 text-purple-300',
  urgente:  'border-orange-500 bg-orange-500/10 text-orange-300',
};

export function NuevoTicketModal({ isOpen, onClose, onSubmit, submitting }: Props) {
  const [asunto, setAsunto]           = useState('');
  const [categoria, setCategoria]     = useState<TicketCategoria | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [errores, setErrores]         = useState<Record<string, string>>({});

  const validar = (): boolean => {
    const nuevosErrores: Record<string, string> = {};
    if (!asunto.trim() || asunto.trim().length < 5 || asunto.trim().length > 120)
      nuevosErrores.asunto = 'El asunto es obligatorio (5 a 120 caracteres)';
    if (!categoria)
      nuevosErrores.categoria = 'Seleccioná una categoría';
    if (!descripcion.trim() || descripcion.trim().length < 20 || descripcion.trim().length > 1000)
      nuevosErrores.descripcion = 'La descripción debe tener entre 20 y 1000 caracteres';
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validar() || !categoria) return;
    const ok = await onSubmit({ asunto: asunto.trim(), categoria, descripcion: descripcion.trim() });
    if (ok) {
      setAsunto(''); setCategoria(null); setDescripcion(''); setErrores({});
      onClose();
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setAsunto(''); setCategoria(null); setDescripcion(''); setErrores({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Nuevo ticket de soporte">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-lg bg-[#0d0d0d] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
                <div>
                  <h2 className="text-white font-bold text-lg tracking-tight">Nuevo ticket de soporte</h2>
                  <p className="text-zinc-500 text-xs mt-0.5">Describí el problema o consulta con el mayor detalle posible.</p>
                </div>
                <button onClick={handleClose} aria-label="Cerrar" className="text-zinc-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800">
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

                {/* Asunto */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5">
                    Asunto <span className="text-zinc-600 normal-case font-normal tracking-normal">({asunto.length}/120)</span>
                  </label>
                  <input
                    type="text"
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value.slice(0, 120))}
                    placeholder="Ej: El módulo de stock no carga correctamente"
                    className={cn(
                      'w-full bg-zinc-900 border rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-zinc-600 outline-none transition-colors',
                      errores.asunto ? 'border-red-500' : 'border-zinc-700 focus:border-zinc-500'
                    )}
                  />
                  {errores.asunto && <p className="text-red-400 text-xs mt-1">{errores.asunto}</p>}
                </div>

                {/* Categoría */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest block mb-2">Categoría</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIAS.map((op) => (
                      <button
                        key={op.value}
                        type="button"
                        onClick={() => setCategoria(op.value)}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all duration-150',
                          categoria === op.value
                            ? CATEGORIA_ACTIVE[op.value]
                            : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                        )}
                      >
                        <span className="text-lg leading-none">{op.emoji}</span>
                        <div>
                          <p className="text-sm font-semibold leading-tight">{op.label}</p>
                          <p className="text-[11px] opacity-60">{op.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {errores.categoria && <p className="text-red-400 text-xs mt-1">{errores.categoria}</p>}
                </div>

                {/* Descripción */}
                <div>
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest block mb-1.5">
                    Descripción <span className="text-zinc-600 normal-case font-normal tracking-normal">({descripcion.length}/1000)</span>
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value.slice(0, 1000))}
                    placeholder="Describí el problema con detalle: qué hiciste, qué esperabas, qué ocurrió..."
                    rows={4}
                    className={cn(
                      'w-full bg-zinc-900 border rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-zinc-600 outline-none resize-none transition-colors',
                      errores.descripcion ? 'border-red-500' : 'border-zinc-700 focus:border-zinc-500'
                    )}
                  />
                  {errores.descripcion && <p className="text-red-400 text-xs mt-1">{errores.descripcion}</p>}
                </div>

                {/* Footer */}
                <div className="flex gap-3 pt-1">
                  <Button type="button" variant="ghost" className="flex-1" onClick={handleClose} disabled={submitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1" loading={submitting}>
                    <Send size={14} />
                    Enviar ticket
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
