'use client';

import { useState, useEffect } from 'react';
import { Plus, Sparkles, Search } from 'lucide-react';
import { DishAdminCard } from '@/components/platos/DishAdminCard';
import { DishFormPanel } from '@/components/platos/DishFormPanel';
import { DishSuggesterModal } from '@/components/platos/DishSuggesterModal';
import { ConfirmDeleteModal } from '@/components/superadm/shared/ConfirmDeleteModal';
import { useDishesStore } from '@/store/dishesStore';
import { useStockStore } from '@/store/stockStore';
import type { Dish, DishCategory } from '@/types/dishes';

const CATEGORIES: { value: DishCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
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

export default function PlatosPage() {
  const { getDishesByCategory, setSearchQuery, setSelectedCategory, selectedCategory, searchQuery, recalculateAvailability } = useDishesStore();
  const { categories } = useStockStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSuggesterOpen, setIsSuggesterOpen] = useState(false);
  const [dishToEdit, setDishToEdit] = useState<Dish | undefined>();
  const [dishToDelete, setDishToDelete] = useState<Dish | undefined>();

  useEffect(() => {
    const allIngredients = categories.flatMap(cat => cat.ingredients);
    recalculateAvailability(allIngredients);
  }, [categories, recalculateAvailability]);

  const filteredDishes = getDishesByCategory(selectedCategory).filter(dish =>
    dish.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (dish: Dish) => {
    setDishToEdit(dish);
    setIsFormOpen(true);
  };

  const handleDelete = (dish: Dish) => {
    setDishToDelete(dish);
  };

  const confirmDelete = () => {
    if (dishToDelete) {
      useDishesStore.getState().deleteDish(dishToDelete.id);
      setDishToDelete(undefined);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Platos</h1>
          <p className="text-[#676b67]">Gestión del menú del restaurante</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsSuggesterOpen(true)}
            className="px-4 py-2 border border-[#252525] text-white rounded-lg hover:bg-[#202020] flex items-center gap-2"
          >
            <Sparkles size={16} />
            Sugerencias
          </button>
          <button
            onClick={() => {
              setDishToEdit(undefined);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 flex items-center gap-2"
          >
            <Plus size={16} />
            Nuevo plato
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#676b67]" size={18} />
          <input
            type="text"
            placeholder="Buscar plato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151515] border border-[#252525] rounded-lg pl-10 pr-4 py-2 text-white"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as any)}
          className="bg-[#151515] border border-[#252525] rounded-lg px-4 py-2 text-white"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDishes.map((dish) => (
          <DishAdminCard
            key={dish.id}
            dish={dish}
            onEdit={() => handleEdit(dish)}
            onDelete={() => handleDelete(dish)}
          />
        ))}
        {filteredDishes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-[#676b67]">No hay platos para mostrar</p>
          </div>
        )}
      </div>

      <DishFormPanel
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setDishToEdit(undefined);
        }}
        dishToEdit={dishToEdit}
      />

      <DishSuggesterModal
        isOpen={isSuggesterOpen}
        onClose={() => setIsSuggesterOpen(false)}
      />

      <ConfirmDeleteModal
        isOpen={!!dishToDelete}
        onClose={() => setDishToDelete(undefined)}
        onConfirm={confirmDelete}
        title={`Eliminar "${dishToDelete?.name || ''}"`}
        message="¿Estás seguro de que querés eliminar este plato?"
      />
    </div>
  );
}
