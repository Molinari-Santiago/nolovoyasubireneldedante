'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TicketEstadoBadge } from './TicketEstadoBadge';
import { TicketCategoriaBadge, getCategoriaBorderColor } from './TicketCategoriaBadge';
import { cn } from '@/hooks/lib/utils';
import type { TicketSoporte, TicketEstado } from '@/types/soporte';

interface Props {
  ticket: TicketSoporte | null;
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onActualizarEstado: (id: string, estado: TicketEstado, respuesta?: string) => Promise<void>;
}

const ESTADOS_ORDEN: TicketEstado[] = ['abierto', 'en_revision', 'resuelto', 'cerrado'];

const ESTADO_LABEL: Record<TicketEstado, string> = {
  abierto:     'Abierto',
  en_revision: 'En revisión',
  resuelto:    'Resuelto',
  cerrado:     'Cerrado',
};

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function TicketDetalleModal({ ticket, isOpen, isAdmin, onClose, onActualizarEstado }: Props) {
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<TicketEstado | null>(null);
  const [respuesta, setRespuesta]                   = useState('');
  const [guardando, setGuardando]                   = useState(false);

  if (!ticket) return null;

  const estadoActivo = estadoSeleccionado ?? ticket.estado;
  const borderColor  = getCategoriaBorderColor(ticket.categoria);

  const handleGuardar = async () => {
    if (!estadoSeleccionado) return;
    setGuardando(true);
    await onActualizarEstado(ticket.id, estadoSeleccionado, respuesta || undefined);
    setGuardando(false);
    setEstadoSeleccionado(null);
    setRespuesta('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Ticket: ${ticket.asunto}`}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'relative w-full max-w-xl bg-[#0d0d0d] border border-zinc-800 border-l-4 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col',
                borderColor
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-800 flex-shrink-0">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <TicketCategoriaBadge categoria={ticket.categoria} />
                    <TicketEstadoBadge estado={ticket.estado} />
                  </div>
                  <h2 className="text-white font-bold text-lg leading-snug">{ticket.asunto}</h2>
                </div>
                <button onClick={onClose} aria-label="Cerrar" className="text-zinc-600 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800 flex-shrink-0">
                  <X size={18} />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                {/* Meta */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {ticket.nombre_usuario && (
                    <div>
                      <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold mb-1">Usuario</p>
                      <p className="text-zinc-300">{ticket.nombre_usuario} <span className="text-zinc-600 text-xs capitalize">({ticket.rol_usuario})</span></p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold mb-1">Creado</p>
                    <p className="text-zinc-300">{formatFecha(ticket.creado_en)}</p>
                  </div>
                  {ticket.resuelto_en && (
                    <div>
                      <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold mb-1">Resuelto</p>
                      <p className="text-zinc-300">{formatFecha(ticket.resuelto_en)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold mb-1">ID</p>
                    <p className="text-zinc-600 text-xs font-mono truncate">{ticket.id}</p>
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold mb-2">Descripción</p>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.descripcion}</p>
                  </div>
                </div>

                {/* Respuesta interna (si existe) */}
                {ticket.respuesta_interna && (
                  <div>
                    <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold mb-2">Respuesta del equipo</p>
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                      <p className="text-green-300 text-sm leading-relaxed whitespace-pre-wrap">{ticket.respuesta_interna}</p>
                    </div>
                  </div>
                )}

                {/* Timeline visual */}
                <div>
                  <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold mb-3">Estado del ticket</p>
                  <div className="flex items-center gap-0">
                    {ESTADOS_ORDEN.map((est, i) => {
                      const idx    = ESTADOS_ORDEN.indexOf(ticket.estado);
                      const isPast = i <= idx;
                      return (
                        <div key={est} className="flex items-center flex-1 last:flex-none">
                          <div className={cn('flex flex-col items-center gap-1', i < ESTADOS_ORDEN.length - 1 && 'flex-1')}>
                            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all',
                              isPast ? 'bg-white border-white' : 'bg-zinc-900 border-zinc-700')}>
                              {isPast && i === idx ? <CheckCircle2 size={12} className="text-black" /> : isPast ? <CheckCircle2 size={12} className="text-black" /> : <Clock size={10} className="text-zinc-600" />}
                            </div>
                            <span className={cn('text-[9px] text-center font-semibold uppercase tracking-wider whitespace-nowrap',
                              isPast ? 'text-zinc-300' : 'text-zinc-700')}>
                              {ESTADO_LABEL[est]}
                            </span>
                          </div>
                          {i < ESTADOS_ORDEN.length - 1 && (
                            <div className={cn('h-px flex-1 mx-1 mb-4 transition-all', isPast && i < idx ? 'bg-white' : 'bg-zinc-800')} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Panel admin — cambiar estado */}
                {isAdmin && (
                  <div className="border border-zinc-800 rounded-xl p-4 space-y-4 bg-zinc-900/40">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                      <AlertCircle size={12} /> Panel de administración
                    </p>

                    {/* Selector de estado */}
                    <div>
                      <p className="text-xs text-zinc-600 mb-2 font-semibold">Cambiar estado</p>
                      <div className="flex flex-wrap gap-2">
                        {ESTADOS_ORDEN.map((est) => (
                          <button
                            key={est}
                            type="button"
                            onClick={() => setEstadoSeleccionado(est)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                              estadoActivo === est
                                ? 'bg-white text-black border-white'
                                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300'
                            )}
                          >
                            {ESTADO_LABEL[est]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Respuesta interna */}
                    <div>
                      <label className="text-xs text-zinc-600 mb-1.5 font-semibold block">Respuesta interna (opcional)</label>
                      <textarea
                        value={respuesta}
                        onChange={(e) => setRespuesta(e.target.value)}
                        placeholder="Agrega una nota o respuesta para el usuario..."
                        rows={3}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-600 outline-none resize-none focus:border-zinc-500 transition-colors"
                      />
                    </div>

                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleGuardar}
                      loading={guardando}
                      disabled={!estadoSeleccionado}
                    >
                      Guardar cambios
                    </Button>
                  </div>
                )}

                {/* Mensaje para usuarios no-admin */}
                {!isAdmin && (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 text-center">
                    <p className="text-blue-300 text-sm">Nuestro equipo está revisando tu solicitud.</p>
                    <p className="text-zinc-600 text-xs mt-1">Te notificaremos cuando haya novedades.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
