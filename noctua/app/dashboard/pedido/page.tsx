'use client';

import { useEffect, useState, useMemo } from 'react';
import { useStockStore } from '@/store/stockStore';
import { useDishesStore } from '@/store/dishesStore';
import { usePedidosStore } from '@/store/pedidosStore';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DishCustomizerPanel } from '@/components/pedidos/DishCustomizerPanel';
import type { Dish } from '@/types/dishes';

const CATEGORIES: { value: 'all' | any; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'entradas', label: 'Entradas' },
  { value: 'hamburguesas', label: 'Hamburguesas' },
  { value: 'sandwiches', label: 'Sandwiches' },
  { value: 'minutas', label: 'Minutas' },
  { value: 'pastas', label: 'Pastas' },
  { value: 'pizzas', label: 'Pizzas' },
  { value: 'ensaladas', label: 'Ensaladas' },
  { value: 'postres', label: 'Postres' },
  { value: 'bebidas_sin_alcohol', label: 'Bebidas sin alcohol' },
  { value: 'bebidas_con_alcohol', label: 'Bebidas con alcohol' },
  { value: 'cafeteria', label: 'Cafetería' },
];

export default function PedidosPage() {
  const router = useRouter();
  const { categories } = useStockStore();
  const { recalculateAvailability, getDishesByCategory } = useDishesStore();
  const { pedidoActual, agregarItem } = usePedidosStore();
  
  const allIngredients = useMemo(() => 
    categories.flatMap(cat => cat.ingredients),
  [categories]);

  useEffect(() => {
    recalculateAvailability(allIngredients);
  }, [allIngredients, recalculateAvailability]);

  const [selectedCategory, setSelectedCategory] = useState<'all' | any>('all');
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  const filteredDishes = getDishesByCategory(selectedCategory);

  const handleSelectDish = (dish: Dish) => {
    setSelectedDish(dish);
    setIsCustomizerOpen(true);
  };

  const handleAddToOrder = (data: any) => {
    // Convert data to ItemPedido format expected by the store
    const item = {
      productoId: data.dishId || data.id,
      nombre: data.name || data.dishName,
      cantidad: data.quantity || 1,
      precioUnitario: data.basePrice || data.price,
      notas: data.notes || ''
    };
    agregarItem(item);
    setIsCustomizerOpen(false);
    setSelectedDish(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-[#202020] text-white hover:bg-[#252525] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Tomar Pedido</h1>
            <p className="text-[#676b67]">Selecciona platos y personaliza</p>
          </div>
        </div>
        <button 
          onClick={() => router.push('/dashboard/pedido')}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white flex items-center gap-2 hover:bg-violet-700 transition-colors"
        >
          <ShoppingCart size={20} />
          <span>Ver pedido ({pedidoActual?.items.length || 0})</span>
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap ${
              selectedCategory === cat.value
                ? 'bg-violet-600 text-white'
                : 'bg-[#202020] text-[#676b67] hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDishes.map(dish => (
          <div
            key={dish.id}
            className={`bg-[#151515] border border-[#252525] rounded-xl p-6 transition-all ${
              dish.isAvailable && dish.maxAvailable > 0 ? 'cursor-pointer hover:border-violet-500/50' : 'opacity-60 cursor-not-allowed'
            }`}
            onClick={() => dish.isAvailable && dish.maxAvailable > 0 && handleSelectDish(dish)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-white font-semibold text-lg">{dish.name}</h3>
              <span className="text-white font-bold text-xl">${dish.price.toFixed(2)}</span>
            </div>
            
            {dish.description && (
              <p className="text-[#676b67] text-sm mb-3">{dish.description}</p>
            )}

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 rounded-full text-xs bg-[#202020] text-[#676b67]">
                {dish.category}
              </span>
              {dish.isAvailable && dish.maxAvailable > 0 ? (
                <span className="px-2 py-1 rounded-full text-xs bg-green-900/30 text-green-300">
                  {dish.maxAvailable} disponibles
                </span>
              ) : (
                <span className="px-2 py-1 rounded-full text-xs bg-red-900/30 text-red-300">
                  Agotado
                </span>
              )}
            </div>

            {dish.recipe.length > 0 && (
              <div className="text-xs text-[#676b67]">
                {dish.recipe.slice(0, 3).map((ing, idx) => (
                  <span key={idx} className="mr-2">{ing.ingredientName}</span>
                ))}
                {dish.recipe.length > 3 && (
                  <span>+{dish.recipe.length - 3} más</span>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredDishes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-[#676b67]">No hay platos disponibles</p>
          </div>
        )}
      </div>

      {selectedDish && (
        <DishCustomizerPanel
          isOpen={isCustomizerOpen}
          onClose={() => {
            setIsCustomizerOpen(false);
            setSelectedDish(null);
          }}
          dish={selectedDish}
          allIngredients={allIngredients}
          onAddToOrder={handleAddToOrder}
        />
      )}
    </div>
  );
}
