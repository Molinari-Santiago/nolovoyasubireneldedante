import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gncnhbxwfejdmpbenvdt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTMzNTIsImV4cCI6MjA5NDA4OTM1Mn0.IMh5XpZ9vECU1iWKh1xl0lsAXKVuwJQZgHu4dYqZads';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log("Obteniendo productos...");
  const { data: productos, error: errProd } = await supabase.from('productos').select('categoria_id');
  
  if (errProd) {
    console.error("Error:", errProd);
    return;
  }

  const uniqueCategoriaIds = [...new Set(productos.filter(p => p.categoria_id).map(p => p.categoria_id))];
  console.log("IDs de categoría huérfanos:", uniqueCategoriaIds);

  const mockNames = ["Cafetería", "Restaurante", "Bebidas", "Combos", "Postres", "Varios"];
  
  for (let i = 0; i < uniqueCategoriaIds.length; i++) {
    const id = uniqueCategoriaIds[i];
    const nombre = mockNames[i] || `Categoría ${i + 1}`;
    
    console.log(`Insertando categoría: ${nombre} (${id})`);
    
    const { error } = await supabase.from('categorias').insert([{
      id,
      nombre,
      color: 'bg-[#1a1a1a]'
    }]);

    if (error) {
      console.error(`Error insertando ${id}:`, error.message);
    } else {
      console.log(`✅ Categoría ${nombre} insertada.`);
    }
  }
  
  console.log("¡Listo!");
}

fix();
