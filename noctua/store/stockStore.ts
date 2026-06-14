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
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'lastUpdated'>, precio: number, isNewCategory: boolean) => Promise<void>;
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
    categories: [],
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
      try {
        const { obtenerCategorias } = await import("@/hooks/lib/api/productosApi");
        const data = await obtenerCategorias();
        set({ categorias: data });
      } catch (error) {
        console.error("Error cargando categorias:", error);
        set({ categorias: mockCategorias }); // Fallback
      }
    },
    cargarProductos: async () => {
      try {
        const { obtenerProductos } = await import("@/hooks/lib/api/productosApi");
        const data = await obtenerProductos();
        set({ productos: data });

        const ingredients: Ingredient[] = data.map((p) => ({
          id: p.id,
          name: p.nombre,
          category: p.categoria?.nombre || p.categoria_id || "Sin categoría",
          stock: p.stock,
          unit: "unidades",
          minStock: 5,
          lastUpdated: new Date(),
        }));
        
        get().setIngredients(ingredients);
      } catch (error) {
        console.error("Error cargando productos:", error);
        set({ productos: mockProductos }); // Fallback
      }
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

    updateStock: async (ingredientId: string, newStock: number) => {
      // Optimistic update
      set((state) => ({
        categories: state.categories.map((cat) => ({
          ...cat,
          ingredients: cat.ingredients.map((ing) =>
            ing.id === ingredientId
              ? { ...ing, stock: Math.max(0, newStock), lastUpdated: new Date() }
              : ing
          ),
        })),
        productos: state.productos.map(p => p.id === ingredientId ? { ...p, stock: Math.max(0, newStock) } : p)
      }));

      try {
        const { apiFetch } = await import("@/hooks/lib/api/client");
        await apiFetch(`/productos/${ingredientId}`, {
          method: "PUT",
          body: JSON.stringify({ stock: Math.max(0, newStock) }),
        });
      } catch (error) {
        console.error("Error al actualizar stock en DB:", error);
      }
    },

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

    addIngredient: async (ingredient, precio, isNewCategory) => {
      try {
        const { crearProducto, crearCategoria } = await import("@/hooks/lib/api/productosApi");
        
        let categoryId = "";
        if (isNewCategory) {
          const nuevaCat = await crearCategoria(ingredient.category);
          categoryId = nuevaCat.id;
          set((state) => ({ categorias: [...state.categorias, nuevaCat] }));
        } else {
          // Find existing category ID
          const cat = get().categorias.find(c => c.nombre === ingredient.category);
          categoryId = cat?.id || ingredient.category;
        }

        const result = await crearProducto({
          nombre: ingredient.name,
          precio: precio,
          categoria_id: categoryId,
          stock: ingredient.stock,
          disponible: true,
        });

        if (result.success && result.producto) {
          const p = result.producto;
          const newIngredient: Ingredient = {
            id: p.id,
            name: p.nombre,
            category: p.categoria?.nombre || p.categoria_id,
            subcategory: ingredient.subcategory,
            stock: p.stock,
            unit: ingredient.unit,
            minStock: ingredient.minStock,
            lastUpdated: new Date(),
          };

          set((state) => {
            const categoryExists = state.categories.some(
              (cat) => cat.name === newIngredient.category
            );
            if (categoryExists) {
              return {
                productos: [...state.productos, p],
                categories: state.categories.map((cat) =>
                  cat.name === newIngredient.category
                    ? { ...cat, ingredients: [...cat.ingredients, newIngredient] }
                    : cat
                ),
              };
            } else {
              return {
                productos: [...state.productos, p],
                categories: [
                  ...state.categories,
                  {
                    id: slugify(newIngredient.category),
                    name: newIngredient.category,
                    ingredients: [newIngredient],
                  },
                ],
              };
            }
          });
        }
      } catch (error) {
        console.error("Error guardando ingrediente en base de datos:", error);
        throw error;
      }
    },

    removeIngredient: async (ingredientId: string) => {
      // Optimistic update
      set((state) => ({
        categories: state.categories.map((cat) => ({
          ...cat,
          ingredients: cat.ingredients.filter((ing) => ing.id !== ingredientId),
        })),
        productos: state.productos.filter(p => p.id !== ingredientId)
      }));

      try {
        const { eliminarProducto } = await import("@/hooks/lib/api/productosApi");
        await eliminarProducto(ingredientId);
      } catch (error) {
        console.error("Error eliminando ingrediente en base de datos:", error);
      }
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
