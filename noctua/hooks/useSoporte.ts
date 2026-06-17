'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/hooks/lib/supabaseClient';
import {
  getMyTickets,
  getAllTickets,
  createTicket,
} from '@/services/soporteService';
import { toast } from '@/components/ui/Toast';
import type {
  TicketSoporte,
  TicketEstado,
  CreateTicketPayload,
} from '@/types/soporte';

interface UseSoporteReturn {
  tickets: TicketSoporte[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  crearTicket: (payload: CreateTicketPayload) => Promise<boolean>;
  actualizarEstado: (id: string, estado: TicketEstado, respuesta?: string) => Promise<void>;
  refetch: () => void;
}

export function useSoporte(): UseSoporteReturn {
  const usuario = useAuthStore((s) => s.usuario);
  const isAdmin = usuario?.rol === 'admin';

  const [tickets, setTickets]     = useState<TicketSoporte[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Carga tickets según el rol del usuario */
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = isAdmin ? await getAllTickets() : await getMyTickets();
      setTickets(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar tickets';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  /** Crea un nuevo ticket y dispara el email vía API route */
  const crearTicket = useCallback(
    async (payload: CreateTicketPayload): Promise<boolean> => {
      if (!usuario) {
        toast.error('Error', 'Debés estar autenticado para crear un ticket.');
        return false;
      }

      setSubmitting(true);
      try {
        // Obtenemos la sesión real de Supabase si existe
        const { data: { session } } = await supabase.auth.getSession();
        let authUserId: string | null = session?.user?.id ?? null;
        let dbUserId: string | null = null;

        if (authUserId) {
          const { data: userRow } = await supabase
            .from('usuarios')
            .select('id')
            .eq('auth_user_id', authUserId)
            .maybeSingle();
          if (userRow) dbUserId = userRow.id;
        }

        const userForService = {
          id: dbUserId,
          auth_user_id: authUserId,
          nombre: usuario.nombre,
          rol: usuario.rol,
        };

        const nuevoTicket = await createTicket(payload, userForService);

        // Dispara email — no bloquea si falla
        try {
          await fetch('/api/soporte', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticketId: nuevoTicket.id,
              asunto: nuevoTicket.asunto,
              categoria: nuevoTicket.categoria,
              descripcion: nuevoTicket.descripcion,
              nombreUsuario: usuario.nombre,
              rolUsuario: usuario.rol,
              creadoEn: nuevoTicket.creado_en,
            }),
          });
        } catch (emailErr) {
          // El ticket ya está en BD — solo loguear el error de email
          console.warn('Error al enviar email de notificación:', emailErr);
        }

        setTickets((prev) => [nuevoTicket, ...prev]);
        toast.success('Ticket enviado', 'Te responderemos pronto.');
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al crear el ticket';
        toast.error('Error al enviar ticket', msg);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [usuario]
  );

  /** Actualiza el estado de un ticket (solo admins) — usa API route con service role */
  const actualizarEstado = useCallback(
    async (id: string, estado: TicketEstado, respuesta?: string): Promise<void> => {
      try {
        const res = await fetch(`/api/soporte/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estado,
            ...(respuesta !== undefined && { respuesta_interna: respuesta }),
          }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? 'Error al actualizar el estado del ticket.');
        }

        await fetchTickets();
        toast.success('Estado actualizado', `Ticket marcado como "${estado}".`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al actualizar estado';
        toast.error('Error', msg);
      }
    },
    [fetchTickets]
  );

  return {
    tickets,
    loading,
    error,
    submitting,
    crearTicket,
    actualizarEstado,
    refetch: fetchTickets,
  };
}
