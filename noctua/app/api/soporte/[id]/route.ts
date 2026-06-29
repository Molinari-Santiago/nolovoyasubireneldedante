import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Faltan variables de entorno de Supabase.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;

    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: 'ID de ticket requerido.' },
        { status: 400 }
      );
    }

    const body = await req.json() as {
      estado?: string;
      respuesta_interna?: string;
    };

    if (!body.estado) {
      return NextResponse.json(
        { success: false, error: 'El campo "estado" es requerido.' },
        { status: 400 }
      );
    }

    const ESTADOS_VALIDOS = ['abierto', 'en_revision', 'resuelto', 'cerrado'];
    if (!ESTADOS_VALIDOS.includes(body.estado)) {
      return NextResponse.json(
        { success: false, error: `Estado inválido: ${body.estado}` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const cambios: Record<string, unknown> = {
      estado: body.estado,
      actualizado_en: new Date().toISOString(),
    };

    if (body.respuesta_interna !== undefined) {
      cambios.respuesta_interna = body.respuesta_interna;
    }

    if (body.estado === 'resuelto') {
      cambios.resuelto_en = new Date().toISOString();
    } else {
      cambios.resuelto_en = null;
    }

    const { error } = await supabase
      .from('tickets_soporte')
      .update(cambios)
      .eq('id', ticketId);

    if (error) {
      console.error('[soporte/[id]] Error al actualizar:', error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ticketId, estado: body.estado });
  } catch (err) {
    console.error('[soporte/[id]] Error inesperado:', err);
    return NextResponse.json(
      { success: false, error: 'Error interno al actualizar el ticket.' },
      { status: 500 }
    );
  }
}
