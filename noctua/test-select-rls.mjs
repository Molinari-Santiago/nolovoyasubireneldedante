import { createClient } from '@supabase/supabase-js';

// Test con anon key (lo que usa el frontend)
const supabaseAnon = createClient(
  'https://gncnhbxwfejdmpbenvdt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTMzNTIsImV4cCI6MjA5NDA4OTM1Mn0.IMh5XpZ9vECU1iWKh1xl0lsAXKVuwJQZgHu4dYqZads'
);

// Test con service key (lo que usa el backend)
const supabaseAdmin = createClient(
  'https://gncnhbxwfejdmpbenvdt.supabase.co',
  'sb_secret_ijG7-bKe1MoQSKmbTFkEWA_uJzAiZC5',
  { auth: { persistSession: false } }
);

async function run() {
  const { data: anonData, error: anonErr } = await supabaseAnon
    .from('pedidos')
    .select('id, estado')
    .limit(10);

  console.log('ANON SELECT:', anonErr?.message || `${anonData.length} pedidos encontrados`);

  const { data: adminData, error: adminErr } = await supabaseAdmin
    .from('pedidos')
    .select('id, estado')
    .limit(10);

  console.log('ADMIN SELECT:', adminErr?.message || `${adminData.length} pedidos encontrados`);
}

run();
