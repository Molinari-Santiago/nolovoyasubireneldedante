'use client';

import { Headphones } from 'lucide-react';
import { useSoporte } from '@/hooks/useSoporte';
import { useAuthStore } from '@/store/authStore';
import { TicketListView } from '@/components/soporte/TicketListView';

export default function SoportePage() {
  const usuario = useAuthStore((s) => s.usuario);
  const isAdmin = usuario?.rol === 'admin';

  const {
    tickets,
    loading,
    error,
    submitting,
    crearTicket,
    actualizarEstado,
    refetch,
  } = useSoporte();

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
          <Headphones size={20} className="text-zinc-400" />
        </div>
        <div>
          <h1 className="text-white font-black text-2xl tracking-tight">Soporte</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Abrí un ticket si encontrás un problema o tenés una consulta. Nuestro equipo te responderá a la brevedad.
          </p>
        </div>
      </div>

      {/* Lista de tickets */}
      <TicketListView
        tickets={tickets}
        loading={loading}
        error={error}
        submitting={submitting}
        isAdmin={isAdmin}
        onCrearTicket={crearTicket}
        onActualizarEstado={actualizarEstado}
        onRefetch={refetch}
      />
    </div>
  );
}
