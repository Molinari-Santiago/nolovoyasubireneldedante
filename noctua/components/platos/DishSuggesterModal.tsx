'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { useDishesStore } from '@/store/dishesStore';
import { useStockStore } from '@/store/stockStore';
import { suggestDishesFromStock } from '@/lib/dishSuggester';
import type { Dish, DishCategory } from '@/types/dishes';
import { generateId } from '@/hooks/lib/utils';

interface DishSuggesterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DishSuggesterModal({ isOpen, onClose }: DishSuggesterModalProps) {
  const { addDish } = useDishesStore();
  const { categories } = useStockStore();
  
  const allStockIngredients = useMemo(() => 
    categories.flatMap(cat => cat.ingredients), 
  [categories]);

  const suggestions = useMemo(() => 
    suggestDishesFromStock(allStockIngredients),
  [allStockIngredients]);

  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleAddSelected = () => {
    selectedSuggestions.forEach(index => {
      const suggestion = suggestions[index];
      if (suggestion) {
        addDish({
          name: suggestion.name || 'Nuevo plato',
          category: (suggestion.category as DishCategory) || 'minutas',
          price: suggestion.price || 0,
          description: suggestion.description,
          recipe: suggestion.recipe || [],
        });
      }
    });
    setSelectedSuggestions(new Set());
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-[#0a0a0a] border border-[#252525] rounded-2xl z-50"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-white font-bold text-xl">
                  Platos sugeridos
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#202020] rounded-lg"
                >
                  <X size={20} className="text-[#676b67]" />
                </button>
              </div>

              {suggestions.length === 0 ? (
                <p className="text-[#676b67] text-center py-8">
                  No hay suficientes ingredientes para sugerir platos
                </p>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => toggleSelection(index)}
                        className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                          selectedSuggestions.has(index)
                            ? 'border-violet-500 bg-violet-500/10'
                            : 'border-[#252525] bg-[#151515] hover:bg-[#202020]'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-white font-semibold">{suggestion.name}</h3>
                            {suggestion.description && (
                              <p className="text-[#676b67] text-sm mt-1">{suggestion.description}</p>
                            )}
                            {suggestion.recipe && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {suggestion.recipe.slice(0, 4).map((ing, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 rounded-full text-xs bg-[#202020] text-[#676b67]"
                                  >
                                    {ing.ingredientName}
                                  </span>
                                ))}
                                {suggestion.recipe.length > 4 && (
                                  <span className="px-2 py-1 rounded-full text-xs bg-[#202020] text-[#676b67]">
                                    +{suggestion.recipe.length - 4} más
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {selectedSuggestions.has(index) && (
                            <div className="p-1 bg-violet-600 rounded-full">
                              <Check size={16} className="text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 px-4 py-2 border border-[#252525] text-white rounded-lg hover:bg-[#202020]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddSelected}
                      disabled={selectedSuggestions.size === 0}
                      className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Agregar {selectedSuggestions.size} seleccionados
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
