'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Dish } from '@/types/dishes';

interface DishAdminCardProps {
  dish: Dish;
  onEdit: () => void;
  onDelete: () => void;
}

export function DishAdminCard({ dish, onEdit, onDelete }: DishAdminCardProps) {
  const [showRecipe, setShowRecipe] = useState(false);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      entradas: 'Entradas',
      hamburguesas: 'Hamburguesas',
      sandwiches: 'Sandwiches',
      minutas: 'Minutas',
      pastas: 'Pastas',
      pizzas: 'Pizzas',
      ensaladas: 'Ensaladas',
      postres: 'Postres',
      bebidas_sin_alcohol: 'Bebidas sin alcohol',
      bebidas_con_alcohol: 'Bebidas con alcohol',
      cafeteria: 'Cafetería',
    };
    return labels[category] || category;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#151515] border border-[#252525] rounded-xl p-6"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-white font-semibold text-lg">{dish.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-1 rounded-full text-xs bg-[#202020] text-[#676b67]">
              {getCategoryLabel(dish.category)}
            </span>
            {dish.isAvailable ? (
              <span className="px-2 py-1 rounded-full text-xs bg-green-600/20 text-green-400">
                Disponibles: {dish.maxAvailable}
              </span>
            ) : (
              <span className="px-2 py-1 rounded-full text-xs bg-red-600/20 text-red-400">
                Agotado
              </span>
            )}
          </div>
        </div>
        <span className="text-white font-bold text-xl">${dish.price.toFixed(2)}</span>
      </div>

      {dish.description && (
        <p className="text-[#676b67] text-sm mb-3">{dish.description}</p>
      )}

      <div className="mb-4">
        <button
          onClick={() => setShowRecipe(!showRecipe)}
          className="flex items-center gap-2 text-[#676b67] hover:text-white text-sm"
        >
          {showRecipe ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          Ingredientes de la receta
        </button>
        {showRecipe && (
          <div className="mt-2 space-y-1">
            {dish.recipe.map((ing, idx) => (
              <div key={idx} className="text-sm text-[#676b67] flex justify-between">
                <span>{ing.ingredientName}</span>
                <span>{ing.quantity} {ing.unit}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-2 rounded-lg border border-[#252525] text-white hover:bg-[#202020] flex items-center justify-center gap-2"
        >
          <Edit2 size={16} />
          Editar
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}
