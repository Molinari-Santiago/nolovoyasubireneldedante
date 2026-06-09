import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gncnhbxwfejdmpbenvdt.supabase.co',
  'sb_secret_ijG7-bKe1MoQSKmbTFkEWA_uJzAiZC5',
  { auth: { persistSession: false } }
);

async function testEstado(estado, mesaId) {
  const { data, error } = await supabase
    .from("pedidos")
    .insert({ mesa_id: mesaId, estado, subtotal: 0, impuestos: 0, total: 0 })
    .select("id").single();

  if (error) {
    console.log(`Estado '${estado}': FALLA - ${error.message}`);
    return null;
  }
  console.log(`Estado '${estado}': OK`);
  await supabase.from("pedidos").delete().eq("id", data.id);
  return data.id;
}

async function run() {
  const { data: mesas } = await supabase.from("mesas").select("id").limit(1);
  const mesaId = mesas?.[0]?.id;
  if (!mesaId) return console.log("Sin mesas");

  const estados = ["pendiente", "preparando", "listo", "entregado", "cancelado", "cerrado", "cerrada"];
  for (const e of estados) {
    await testEstado(e, mesaId);
  }
}

run();
