import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Faltan variables de entorno de Supabase para operaciones admin.');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accion } = body;
    const supabaseAdmin = getSupabaseAdmin();

    if (accion === 'crear') {
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json({ error: 'Email y contraseña son requeridos.' }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ id: data.user.id, email: data.user.email });
    }

    if (accion === 'actualizar') {
      const { authUserId, email, password } = body;

      if (!authUserId) {
        return NextResponse.json({ error: 'authUserId es requerido.' }, { status: 400 });
      }

      const updates: { email?: string; password?: string } = {};
      if (email) updates.email = email;
      if (password) updates.password = password;

      const { error } = await supabaseAdmin.auth.admin.updateUserById(authUserId, updates);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true });
    }

    if (accion === 'eliminar') {
      const { authUserId } = body;

      if (!authUserId) {
        return NextResponse.json({ error: 'authUserId es requerido.' }, { status: 400 });
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(authUserId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Acción no reconocida.' }, { status: 400 });
  } catch (error) {
    console.error('Error en API admin/usuarios:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
