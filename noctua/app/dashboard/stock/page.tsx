'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStockStore } from '@/store/stockStore';
import { StockHeader } from '@/components/stock/StockHeader';
import { StockFilters } from '@/components/stock/StockFilters';
import { CategoryAccordion } from '@/components/stock/CategoryAccordion';
import { IngredientRow } from '@/components/stock/IngredientRow';
import { AddIngredientModal } from '@/components/stock/AddIngredientModal';

export default function StockPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    categories,
    filter,
    view,
    searchQuery,
    selectedCategory,
  } = useStockStore();

  const filteredAndGroupedIngredients = useMemo(() => {
    return categories.map(category => {
      let filteredIngredients = [...category.ingredients];

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredIngredients = filteredIngredients.filter(ing =>
          ing.name.toLowerCase().includes(query)
        );
      }

      // Filter by selected category
      if (selectedCategory && selectedCategory !== category.id) {
        filteredIngredients = [];
      }

      // Filter by stock status
      if (filter !== 'all') {
        filteredIngredients = filteredIngredients.filter(ing => {
          if (filter === 'empty') return ing.stock === 0;
          if (filter === 'low') return ing.stock > 0 && ing.stock < ing.minStock;
          if (filter === 'ok') return ing.stock >= ing.minStock;
          return true;
        });
      }

      return { ...category, ingredients: filteredIngredients };
    }).filter(category => category.ingredients.length > 0);
  }, [categories, filter, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      <StockHeader onOpenModal={() => setIsModalOpen(true)} />
      <StockFilters categories={categories} />

      <AnimatePresence mode="popLayout">
        {view === 'grid' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {filteredAndGroupedIngredients.map(category => (
              <CategoryAccordion
                key={category.id}
                category={category}
                filteredIngredients={category.ingredients}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden"
          >
            <table className="w-full">
              <thead className="bg-[#111]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase text-[#676B67]">
                    Ingrediente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase text-[#676B67]">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase text-[#676B67]">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase text-[#676B67]">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-widest uppercase text-[#676B67]">
                    Última actualización
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndGroupedIngredients.flatMap(category =>
                  category.ingredients.map((ing, index) => (
                    <IngredientRow
                      key={ing.id}
                      ingredient={ing}
                      index={index}
                    />
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      <AddIngredientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categories={categories}
      />
    </div>
  );
}
