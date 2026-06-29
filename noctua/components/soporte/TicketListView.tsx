'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, RefreshCw, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TicketCard } from './TicketCard';
import { NuevoTicketModal } from './NuevoTicketModal';
import { TicketDetalleModal } from './TicketDetalleModal';
import { cn } from '@/hooks/lib/utils';
import type { TicketSoporte, TicketEstado, TicketCategoria, CreateTicketPayload } from '@/types/soporte';

interface Props {
  tickets: TicketSoporte[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  isAdmin: boolean;
  onCrearTicket: (payload: CreateTicketPayload) => Promise<boolean>;
  onActualizarEstado: (id: string, estado: TicketEstado, respuesta?: string) => Promise<void>;
  onRefetch: () => void;
}

const FILTROS_ESTADO: { value: TicketEstado | 'todos'; label: string }[] = [
  { value: 'todos',       label: 'Todos' },
  { value: 'abierto',     label: 'Abiertos' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'resuelto',    label: 'Resueltos' },
  { value: 'cerrado',     label: 'Cerrados' },
];

const FILTROS_CATEGORIA: { value: TicketCategoria | 'todas'; label: string }[] = [
  { value: 'todas',    label: 'Todas' },
  { value: 'bug',      label: '🐛 Bug' },
  { value: 'consulta', label: '💬 Consulta' },
  { value: 'mejora',   label: '✨ Mejora' },
  { value: 'urgente',  label: '🚨 Urgente' },
];

/** Skeleton de carga para 3 tarjetas */
function TicketSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
      <div className="flex gap-2 mb-3">
        <div className="h-5 w-16 bg-zinc-800 rounded-full" />
        <div className="h-5 w-16 bg-zinc-800 rounded-full" />
      </div>
      <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2" />
      <div className="h-3 bg-zinc-800 rounded w-full mb-1" />
      <div className="h-3 bg-zinc-800 rounded w-2/3 mb-4" />
      <div className="h-3 bg-zinc-800 rounded w-1/3" />
    </div>
  );
}

export function TicketListView({
  tickets, loading, error, submitting, isAdmin,
  onCrearTicket, onActualizarEstado, onRefetch,
}: Props) {
  const [modalNuevoOpen, setModalNuevoOpen]     = useState(false);
  const [ticketDetalle, setTicketDetalle]       = useState<TicketSoporte | null>(null);
  const [filtroEstado, setFiltroEstado]         = useState<TicketEstado | 'todos'>('todos');
  const [filtroCategoria, setFiltroCategoria]   = useState<TicketCategoria | 'todas'>('todas');
  const [busqueda, setBusqueda]                 = useState('');

  const ticketsFiltrados = useMemo(() => {
    return tickets.filter((t) => {
      const matchEstado    = filtroEstado === 'todos'    || t.estado === filtroEstado;
      const matchCategoria = filtroCategoria === 'todas' || t.categoria === filtroCategoria;
      const matchBusqueda  = busqueda.trim() === '' || t.asunto.toLowerCase().includes(busqueda.toLowerCase());
      return matchEstado && matchCategoria && matchBusqueda;
    });
  }, [tickets, filtroEstado, filtroCategoria, busqueda]);

  const countAbiertos = tickets.filter((t) => t.estado === 'abierto').length;

  return (
    <div className="space-y-5">
      {/* Barra de acciones */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por asunto..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600 transition-colors"
          />
        </div>

        <button
          onClick={onRefetch}
          aria-label="Recargar tickets"
          className="p-2 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800"
        >
          <RefreshCw size={15} />
        </button>

        <Button variant="primary" onClick={() => setModalNuevoOpen(true)}>
          <Plus size={14} />
          Nuevo ticket
        </Button>
      </div>

      {/* Filtros de estado */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS_ESTADO.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltroEstado(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
              filtroEstado === f.value
                ? 'bg-white text-black border-white'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="w-px bg-zinc-800 mx-1" />
        {FILTROS_CATEGORIA.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltroCategoria(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
              filtroCategoria === f.value
                ? 'bg-white text-black border-white'
                : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contador */}
      {!loading && (
        <p className="text-zinc-600 text-sm">
          {countAbiertos > 0
            ? <><span className="text-yellow-400 font-semibold">{countAbiertos}</span> ticket{countAbiertos !== 1 ? 's' : ''} abierto{countAbiertos !== 1 ? 's' : ''}</>
            : 'Sin tickets abiertos'
          }
          {ticketsFiltrados.length !== tickets.length && (
            <span className="ml-1 text-zinc-700">· {ticketsFiltrados.length} mostrado{ticketsFiltrados.length !== 1 ? 's' : ''}</span>
          )}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {loading ? (
          <>
            <TicketSkeleton />
            <TicketSkeleton />
            <TicketSkeleton />
          </>
        ) : ticketsFiltrados.length > 0 ? (
          ticketsFiltrados.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              isAdmin={isAdmin}
              onClick={setTicketDetalle}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Inbox size={40} className="text-zinc-800 mb-4" />
            <p className="text-zinc-500 font-medium">
              {tickets.length === 0
                ? 'No tenés tickets de soporte abiertos. ¡Todo en orden! 🎉'
                : 'No hay tickets que coincidan con los filtros.'}
            </p>
          </div>
        )}
      </div>

      {/* Modales */}
      <NuevoTicketModal
        isOpen={modalNuevoOpen}
        onClose={() => setModalNuevoOpen(false)}
        onSubmit={onCrearTicket}
        submitting={submitting}
      />

      <TicketDetalleModal
        ticket={ticketDetalle}
        isOpen={!!ticketDetalle}
        isAdmin={isAdmin}
        onClose={() => setTicketDetalle(null)}
        onActualizarEstado={async (id, estado, respuesta) => {
          await onActualizarEstado(id, estado, respuesta);
          setTicketDetalle(null);
        }}
      />
    </div>
  );
}
