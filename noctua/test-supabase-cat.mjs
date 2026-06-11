import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gncnhbxwfejdmpbenvdt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTMzNTIsImV4cCI6MjA5NDA4OTM1Mn0.IMh5XpZ9vECU1iWKh1xl0lsAXKVuwJQZgHu4dYqZads'
);

async function run() {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nombre, color')
    .order('nombre');
  
  if (error) {
    console.log("ERROR CATEGORIAS:", error.message);
  } else {
    console.log("CATEGORIAS:", JSON.stringify(data, null, 2));
  }
}

run();
