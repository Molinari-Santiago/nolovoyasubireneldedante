import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gncnhbxwfejdmpbenvdt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTMzNTIsImV4cCI6MjA5NDA4OTM1Mn0.IMh5XpZ9vECU1iWKh1xl0lsAXKVuwJQZgHu4dYqZads'
);

async function run() {
  const { data, error } = await supabase
    .from("pedidos")
    .insert({
      mesa_id: "ced06afd-b878-409d-84c2-6fe7991b7de0", // dummy uuid
      numero_mesa: 1,
      zona: "salon",
      personas: 2,
      total: 100,
      estado: "pendiente",
    })
    .select();
    
  if (error) {
    console.log("INSERT ERROR:", error.message);
  } else {
    console.log("INSERT SUCCESS:", data);
  }
}

run();
