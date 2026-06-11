import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gncnhbxwfejdmpbenvdt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTMzNTIsImV4cCI6MjA5NDA4OTM1Mn0.IMh5XpZ9vECU1iWKh1xl0lsAXKVuwJQZgHu4dYqZads'
);

async function run() {
  const { data, error } = await supabase.from('pedidos').select('*').limit(1);
  if (error) {
    console.log("ERROR:", error.message);
  } else {
    console.log("SCHEMA COLUMNS:", data && data[0] ? Object.keys(data[0]) : "No data to infer columns, but query succeeded");
  }
}

run();
