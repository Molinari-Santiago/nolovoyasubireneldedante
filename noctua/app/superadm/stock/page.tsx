'use client';

import { useEffect, useState } from 'react';
import { useStockStore } from '@/store/stockStore';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import type { Ingredient } from '@/types/stock';

export default function SuperAdmStockPage() {
  const {
    categories,
    cargarCategorias,
    cargarProductos,
    addIngredient,
    removeIngredient,
    updateIngredient,
  } = useStockStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    subcategory?: string;
    stock: number;
    unit: 'unidades' | 'kg' | 'litros' | 'gramos';
    minStock: number;
    precio: number;
    isNewCategory: boolean;
  }>({
    name: '',
    category: '',
    subcategory: '',
    stock: 0,
    unit: 'unidades',
    minStock: 5,
    precio: 0,
    isNewCategory: false,
  });

  useEffect(() => {
    const load = async () => {
      await Promise.all([cargarCategorias(), cargarProductos()]);
      setIsLoading(false);
    };
    load();
  }, [cargarCategorias, cargarProductos]);

  const handleAddOrUpdate = async () => {
    if (!formData.name.trim() || !formData.category.trim()) return;

    try {
      if (editingIngredient) {
        await updateIngredient(editingIngredient.id, {
          name: formData.name,
          category: formData.category,
          subcategory: formData.subcategory,
          stock: formData.stock,
          unit: formData.unit,
          minStock: formData.minStock,
        });
      } else {
        await addIngredient(
          {
            name: formData.name,
            category: formData.category,
            subcategory: formData.subcategory,
            stock: formData.stock,
            unit: formData.unit,
            minStock: formData.minStock,
          },
          formData.precio,
          formData.isNewCategory
        );
      }

      setEditingIngredient(null);
      setIsAdding(false);
      setFormData({
        name: '',
        category: '',
        subcategory: '',
        stock: 0,
        unit: 'unidades',
        minStock: 5,
        precio: 0,
        isNewCategory: false,
      });
    } catch (error) {
      console.error('Error al guardar ingrediente:', error);
    }
  };

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category,
      subcategory: ingredient.subcategory || '',
      stock: ingredient.stock,
      unit: ingredient.unit,
      minStock: ingredient.minStock,
      precio: 0,
      isNewCategory: false,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-[#676b67]">
        Cargando stock...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Stock</h1>
          <p className="text-[#676b67]">Administra ingredientes y materias primas</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditingIngredient(null);
            setFormData({
              name: '',
              category: categories[0]?.name || '',
              subcategory: '',
              stock: 0,
              unit: 'unidades',
              minStock: 5,
              precio: 0,
              isNewCategory: false,
            });
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700"
        >
          <Plus size={18} />
          Nuevo Ingrediente
        </button>
      </div>

      {(isAdding || editingIngredient) && (
        <div className="mb-8 p-6 bg-[#101010] border border-[#252525] rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">
              {editingIngredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
            </h3>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingIngredient(null);
              }}
              className="text-[#676b67] hover:text-white"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#676b67] text-sm mb-2">Nombre del Ingrediente</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#0d0d0d] border border-[#252525] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-[#676b67] text-sm mb-2">Categoría</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  list="categoryList"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="flex-1 bg-[#0d0d0d] border border-[#252525] rounded-lg px-4 py-2 text-white"
                />
                <datalist id="categoryList">
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="block text-[#676b67] text-sm mb-2">Subcategoría (opcional)</label>
              <input
                type="text"
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full bg-[#0d0d0d] border border-[#252525] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-[#676b67] text-sm mb-2">Unidad de Medida</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'unidades' | 'kg' | 'litros' | 'gramos' })}
                className="w-full bg-[#0d0d0d] border border-[#252525] rounded-lg px-4 py-2 text-white"
              >
                <option value="unidades">Unidades</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="gramos">Gramos</option>
                <option value="litros">Litros</option>
              </select>
            </div>

            <div>
              <label className="block text-[#676b67] text-sm mb-2">Stock Actual</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0d0d0d] border border-[#252525] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-[#676b67] text-sm mb-2">Stock Mínimo</label>
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                className="w-full bg-[#0d0d0d] border border-[#252525] rounded-lg px-4 py-2 text-white"
              />
            </div>

            {!editingIngredient && (
              <div>
                <label className="block text-[#676b67] text-sm mb-2">Precio (opcional)</label>
                <input
                  type="number"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0d0d0d] border border-[#252525] rounded-lg px-4 py-2 text-white"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingIngredient(null);
              }}
              className="px-4 py-2 rounded-lg border border-[#252525] text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddOrUpdate}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700"
            >
              {editingIngredient ? 'Guardar Cambios' : 'Agregar Ingrediente'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-[#101010] border border-[#252525] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#252525] flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">{cat.name}</h3>
              <span className="text-[#676b67]">
                {cat.ingredients.length} ingrediente{cat.ingredients.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[#676b67] text-xs uppercase border-b border-[#252525] bg-[#0d0d0d]">
                  <tr>
                    <th className="px-6 py-3">Ingrediente</th>
                    {cat.ingredients.some(i => i.subcategory) && <th className="px-6 py-3">Subcategoría</th>}
                    <th className="px-6 py-3">Stock</th>
                    <th className="px-6 py-3">Unidad</th>
                    <th className="px-6 py-3">Mínimo</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252525]">
                  {cat.ingredients.map((ing) => (
                    <tr key={ing.id} className="hover:bg-[#0d0d0d]">
                      <td className="px-6 py-4 text-white font-medium">{ing.name}</td>
                      {cat.ingredients.some(i => i.subcategory) && (
                        <td className="px-6 py-4 text-[#676b67]">{ing.subcategory || '-'}</td>
                      )}
                      <td className="px-6 py-4">
                        <span className={ing.stock < ing.minStock ? 'text-red-400 font-semibold' : 'text-white'}>
                          {ing.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#676b67]">{ing.unit}</td>
                      <td className="px-6 py-4 text-[#676b67]">{ing.minStock}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEdit(ing)}
                          className="mr-3 text-[#676b67] hover:text-white"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => removeIngredient(ing.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
