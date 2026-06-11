import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gncnhbxwfejdmpbenvdt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTMzNTIsImV4cCI6MjA5NDA4OTM1Mn0.IMh5XpZ9vECU1iWKh1xl0lsAXKVuwJQZgHu4dYqZads'
);

async function run() {
  // Let's see what columns exist in pedidos. We can do an insert of just mesa_id
  const { data, error } = await supabase
    .from("pedidos")
    .select("id, mesa_id, total, estado, mesas(numero, zona, capacidad)");
    
  if (error) {
    console.log("SELECT ERROR:", error.message);
  } else {
    console.log("SELECT SUCCESS:", JSON.stringify(data.slice(0, 2), null, 2));
  }
}

run();
