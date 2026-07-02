'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { RecipeIngredientSelector } from '@/components/pedidos/RecipeIngredientSelector';
import { useDishesStore } from '@/store/dishesStore';
import { useStockStore } from '@/store/stockStore';
import { calculateMaxAvailable } from '@/lib/recipeCalculator';
import type { Dish, DishCategory, RecipeIngredient } from '@/types/dishes';
import { generateId } from '@/hooks/lib/utils';

interface DishFormPanelProps {
  isOpen: boolean;
  onClose: () => void;
  dishToEdit?: Dish;
}

const CATEGORIES: { value: DishCategory; label: string }[] = [
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

export function DishFormPanel({ isOpen, onClose, dishToEdit }: DishFormPanelProps) {
  const { addDish, updateDish } = useDishesStore();
  const { categories } = useStockStore();
  
  const allStockIngredients = useMemo(() => 
    categories.flatMap(cat => cat.ingredients), 
  [categories]);

  const stockMap = useMemo(() => {
    const map = new Map();
    allStockIngredients.forEach(ing => map.set(ing.id, ing));
    return map;
  }, [allStockIngredients]);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<DishCategory>('minutas');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [recipe, setRecipe] = useState<RecipeIngredient[]>([]);

  const maxAvailable = useMemo(() => 
    calculateMaxAvailable(recipe, stockMap),
  [recipe, stockMap]);

  useEffect(() => {
    if (dishToEdit) {
      setName(dishToEdit.name);
      setCategory(dishToEdit.category);
      setPrice(dishToEdit.price.toString());
      setDescription(dishToEdit.description || '');
      setRecipe(dishToEdit.recipe);
    } else {
      setName('');
      setCategory('minutas');
      setPrice('');
      setDescription('');
      setRecipe([]);
    }
  }, [dishToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (dishToEdit) {
      updateDish(dishToEdit.id, {
        name,
        category,
        price: parseFloat(price) || 0,
        description,
        recipe,
      });
    } else {
      addDish({
        name,
        category,
        price: parseFloat(price) || 0,
        description: description || undefined,
        recipe,
      });
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#0a0a0a] border-l border-[#252525] z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-white font-bold text-xl">
                  {dishToEdit ? 'Editar plato' : 'Nuevo plato'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#202020] rounded-lg"
                >
                  <X size={20} className="text-[#676b67]" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium mb-1 block">
                    Nombre del plato
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-[#151515] border border-[#252525] rounded-lg px-3 py-2 text-white"
                    placeholder="Ej: Hamburguesa clásica"
                  />
                </div>

                <div>
                  <label className="text-white text-sm font-medium mb-1 block">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DishCategory)}
                    className="w-full bg-[#151515] border border-[#252525] rounded-lg px-3 py-2 text-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-white text-sm font-medium mb-1 block">
                    Precio ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full bg-[#151515] border border-[#252525] rounded-lg px-3 py-2 text-white"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-white text-sm font-medium mb-1 block">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#151515] border border-[#252525] rounded-lg px-3 py-2 text-white h-24"
                    placeholder="Descripción del plato"
                  />
                </div>

                <RecipeIngredientSelector
                  ingredients={recipe}
                  allStockIngredients={allStockIngredients}
                  onChange={setRecipe}
                />

                <div className="p-3 bg-[#151515] border border-[#252525] rounded-lg">
                  <p className="text-[#676b67] text-sm">
                    Con el stock actual podés preparar <span className="text-white font-bold">{maxAvailable}</span> unidades
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-[#252525] text-white rounded-lg hover:bg-[#202020]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500"
                  >
                    {dishToEdit ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
