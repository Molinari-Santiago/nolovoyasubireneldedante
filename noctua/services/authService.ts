export async function crearAuthUsuario(data: {
  email: string;
  password: string;
}): Promise<{ id: string; email: string }> {
  const res = await fetch('/api/admin/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'crear', ...data }),
  });

  const json = await res.json();

  if (!res.ok) {
    console.warn('No se pudo crear el usuario en Supabase Auth:', json.error);
    return { id: crypto.randomUUID(), email: data.email };
  }

  return json;
}

export async function actualizarAuthUsuario(
  authUserId: string,
  cambios: { email?: string; password?: string }
): Promise<void> {
  const res = await fetch('/api/admin/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'actualizar', authUserId, ...cambios }),
  });

  const json = await res.json();

  if (!res.ok) {
    console.warn('No se pudo actualizar el usuario en Supabase Auth:', json.error);
  }
}

export async function eliminarAuthUsuario(authUserId: string): Promise<void> {
  const res = await fetch('/api/admin/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accion: 'eliminar', authUserId }),
  });

  const json = await res.json();

  if (!res.ok) {
    console.warn('No se pudo eliminar el usuario en Supabase Auth:', json.error);
  }
}
