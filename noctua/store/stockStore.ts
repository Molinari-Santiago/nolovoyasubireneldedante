"use client";

import { create } from "zustand";
import type { Ingredient, StockCategory, StockFilter, StockView } from "@/types/stock";
import type { Categoria, Producto } from "@/types/producto";
import { buildInitialStock } from "@/hooks/lib/stockMockData";

// MOCK DATA FOR BACKWARD COMPATIBILITY
const mockCategorias: Categoria[] = [
  { id: 'cafeteria', nombre: 'Cafetería' },
  { id: 'restaurante', nombre: 'Restaurante' },
  { id: 'bebidas', nombre: 'Bebidas' },
  { id: 'combos', nombre: 'Combos' }
];

const mockProductos: Producto[] = [
  { id: '1', nombre: 'Café con leche', precio: 1200, categoria_id: 'cafeteria', disponible: true },
  { id: '2', nombre: 'Medialunas de manteca', precio: 800, categoria_id: 'cafeteria', disponible: true },
  { id: '3', nombre: 'Milanesa de carne con papas fritas', precio: 4500, categoria_id: 'restaurante', disponible: true },
  { id: '4', nombre: 'Coca Cola 500ml', precio: 600, categoria_id: 'bebidas', disponible: true },
  { id: '5', nombre: 'Combo Milanesa + Bebida', precio: 5000, categoria_id: 'combos', disponible: true },
];

interface StockState {
  // NEW INGREDIENT SYSTEM
  categories: StockCategory[];
  filter: StockFilter;
  view: StockView;
  searchQuery: string;
  selectedCategory: string | null;
  setFilter: (filter: StockFilter) => void;
  setView: (view: StockView) => void;
  setSearch: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setIngredients: (ingredients: Ingredient[]) => void;
  updateStock: (ingredientId: string, newStock: number) => void;
  incrementStock: (ingredientId: string) => void;
  decrementStock: (ingredientId: string) => void;
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'lastUpdated'>) => void;
  removeIngredient: (ingredientId: string) => void;
  getLowStockIngredients: () => Ingredient[];
  getTotalIngredients: () => number;

  // BACKWARD COMPATIBILITY
  categorias: Categoria[];
  productos: Producto[];
  cargarCategorias: () => Promise<void>;
  cargarProductos: () => Promise<void>;
}

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[áàâäã]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[íìîï]/g, "i")
    .replace(/[óòôöõ]/g, "o")
    .replace(/[úùûü]/g, "u")
    .replace(/[ñ]/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const useStockStore = create<StockState>((set, get) => {
  const initialCategories = buildInitialStock();

  return {
    // NEW INGREDIENT SYSTEM
    categories: initialCategories,
    filter: 'all',
    view: 'grid',
    searchQuery: '',
    selectedCategory: null,

    setFilter: (filter: StockFilter) => set({ filter }),
    setView: (view: StockView) => set({ view }),
    setSearch: (searchQuery: string) => set({ searchQuery }),
    setSelectedCategory: (categoryId: string | null) => set({ selectedCategory: categoryId }),

    // BACKWARD COMPATIBILITY
    categorias: mockCategorias,
    productos: mockProductos,
    cargarCategorias: async () => {
      set({ categorias: mockCategorias });
    },
    cargarProductos: async () => {
      set({ productos: mockProductos });
    },

    setIngredients: (ingredients: Ingredient[]) => set((state) => {
      const categoryMap = new Map<string, StockCategory>();

      // Initialize with existing categories (preserving structure)
      state.categories.forEach((cat) => {
        categoryMap.set(cat.name, { ...cat, ingredients: [] });
      });

      // Add ingredients to their respective categories
      ingredients.forEach((ing) => {
        if (!categoryMap.has(ing.category)) {
          categoryMap.set(ing.category, {
            id: slugify(ing.category),
            name: ing.category,
            ingredients: [],
          });
        }
        const cat = categoryMap.get(ing.category)!;
        cat.ingredients.push(ing);
      });

      return { categories: Array.from(categoryMap.values()) };
    }),

    updateStock: (ingredientId: string, newStock: number) =>
      set((state) => ({
        categories: state.categories.map((cat) => ({
          ...cat,
          ingredients: cat.ingredients.map((ing) =>
            ing.id === ingredientId
              ? { ...ing, stock: Math.max(0, newStock), lastUpdated: new Date() }
              : ing
          ),
        })),
      })),

    incrementStock: (ingredientId: string) =>
      set((state) => {
        const currentIngredient = state.categories
          .flatMap((cat) => cat.ingredients)
          .find((ing) => ing.id === ingredientId);
        if (currentIngredient) {
          get().updateStock(ingredientId, currentIngredient.stock + 1);
        }
        return state;
      }),

    decrementStock: (ingredientId: string) =>
      set((state) => {
        const currentIngredient = state.categories
          .flatMap((cat) => cat.ingredients)
          .find((ing) => ing.id === ingredientId);
        if (currentIngredient) {
          get().updateStock(ingredientId, currentIngredient.stock - 1);
        }
        return state;
      }),

    addIngredient: (ingredient: Omit<Ingredient, 'id' | 'lastUpdated'>) => {
      const newIngredient: Ingredient = {
        ...ingredient,
        id: `${slugify(ingredient.name)}-${slugify(ingredient.category)}-${Date.now()}`,
        lastUpdated: new Date(),
      };

      set((state) => {
        const categoryExists = state.categories.some(
          (cat) => cat.name === ingredient.category
        );
        if (categoryExists) {
          return {
            categories: state.categories.map((cat) =>
              cat.name === ingredient.category
                ? { ...cat, ingredients: [...cat.ingredients, newIngredient] }
                : cat
            ),
          };
        } else {
          return {
            categories: [
              ...state.categories,
              {
                id: slugify(ingredient.category),
                name: ingredient.category,
                ingredients: [newIngredient],
              },
            ],
          };
        }
      });
    },

    removeIngredient: (ingredientId: string) => {
      set((state) => ({
        categories: state.categories.map((cat) => ({
          ...cat,
          ingredients: cat.ingredients.filter((ing) => ing.id !== ingredientId),
        })),
      }));
    },

    getLowStockIngredients: () => {
      const allIngredients = get().categories.flatMap((cat) => cat.ingredients);
      return allIngredients.filter((ing) => ing.stock < ing.minStock);
    },

    getTotalIngredients: () => {
      return get().categories.reduce(
        (total, cat) => total + cat.ingredients.length, 0
      );
    },
  };
});
