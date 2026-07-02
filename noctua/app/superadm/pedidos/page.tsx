'use client';

import { useEffect, useState, useMemo } from 'react';
import { useStockStore } from '@/store/stockStore';
import { usePedidosStore } from '@/store/pedidosStore';
import { Plus, Trash2, Layout, Utensils, X, ChefHat } from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/superadm/shared/ConfirmDeleteModal';
import { RecipeIngredientSelector } from '@/components/pedidos/RecipeIngredientSelector';
import { AvailabilityBadge } from '@/components/pedidos/AvailabilityBadge';
import type { Dish, RecipeIngredient } from '@/types/orders';
import { calculateMaxAvailable } from '@/lib/recipeCalculator';

export default function SuperAdmPedidosPage() {
  const {
    categorias, productos,
    cargarCategorias, cargarProductos,
    agregarCategoria, actualizarCategoria, eliminarCategoria,
    agregarProducto, actualizarProducto, eliminarProducto,
  } = useStockStore();
  
  const {
    dishes,
    cargarDishes,
    addDish,
    updateDish,
    deleteDish,
    updateDishesAvailability,
  } = usePedidosStore();
  
  const [tab, setTab] = useState<'categorias' | 'platos' | 'recetas'>('platos');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteProductoId, setDeleteProductoId] = useState<string | null>(null);
  const [deleteDishId, setDeleteDishId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<'categoria' | 'producto' | 'plato' | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      await cargarCategorias();
      await cargarProductos();
      cargarDishes();
    };
    load();
  }, [cargarCategorias, cargarProductos, cargarDishes]);

  useEffect(() => {
    const ingredients = useStockStore.getState().categories.flatMap(cat => cat.ingredients);
    updateDishesAvailability(ingredients);
  }, [updateDishesAvailability]);

  const handleAgregarCategoria = (nombre: string) => {
    if (!nombre.trim()) return;
    agregarCategoria({ nombre });
    setAdding(false);
  };

  const handleGuardarForm = () => {
    if (editing === 'categoria' && editForm) {
      if (editForm.id) {
        actualizarCategoria(editForm.id, editForm);
      } else {
        agregarCategoria(editForm);
      }
    } else if (editing === 'producto' && editForm) {
      if (editForm.id) {
        actualizarProducto(editForm.id, editForm);
      } else {
        agregarProducto(editForm);
      }
    } else if (editing === 'plato' && editForm) {
      if (editForm.id) {
        updateDish(editForm.id, editForm);
      } else {
        const newDish: Dish = {
          id: `dish-${Date.now()}`,
          name: editForm.name,
          categoryId: editForm.categoryId,
          price: editForm.price,
          recipe: editForm.recipe || [],
          maxAvailable: 0,
          isAvailable: true,
          description: editForm.description,
          imageUrl: editForm.imageUrl,
        };
        addDish(newDish);
      }
    }
    setEditing(null);
    setEditForm(null);
  };

  const allIngredients = useMemo(() => {
    return useStockStore.getState().categories.flatMap(cat => cat.ingredients);
  }, []);

  const liveMaxAvailable = useMemo(() => {
    if (!editing || editing !== 'plato' || !editForm) return 0;
    const recipe = editForm.recipe || [];
    const stock = new Map(allIngredients.map(ing => [ing.id, ing]));
    return calculateMaxAvailable(recipe, stock);
  }, [editing, editForm, allIngredients]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Menú & Recetas</h1>
          <p className="text-[#676b67]">Gestiona categorías, platos y enlaza con inventario</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-[#252525]">
        <button
          onClick={() => setTab('categorias')}
          className={`pb-3 border-b-2 transition-all ${
            tab === 'categorias' ? 'text-violet-400 border-violet-400' : 'text-[#676b67] border-transparent hover:text-white'
          }`}
        >
          <Layout size={20} className="inline mr-2" /> Categorías
        </button>
        <button
          onClick={() => setTab('platos')}
          className={`pb-3 border-b-2 transition-all ${
            tab === 'platos' ? 'text-violet-400 border-violet-400' : 'text-[#676b67] border-transparent hover:text-white'
          }`}
        >
          <Utensils size={20} className="inline mr-2" /> Platos
        </button>
        <button
          onClick={() => setTab('recetas')}
          className={`pb-3 border-b-2 transition-all ${
            tab === 'recetas' ? 'text-violet-400 border-violet-400' : 'text-[#676b67] border-transparent hover:text-white'
          }`}
        >
          <ChefHat size={20} className="inline mr-2" /> Recetas
        </button>
      </div>

      {tab === 'categorias' && (
        <div>
          <div className="space-y-3">
            {categorias.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-4 p-4 bg-[#101010] border border-[#252525] rounded-xl"
              >
                <div className="flex-1">
                  <span className="text-white font-medium">{cat.nombre}</span>
                </div>
                <button
                  onClick={() => {
                    setEditForm({ ...cat });
                    setEditing('categoria');
                  }}
                  className="text-[#676b67] hover:text-white mr-2"
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleteId(cat.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
          {adding ? (
            <div className="flex items-center gap-4 p-4 bg-[#101010] border border-violet-500/50 rounded-xl mt-4">
              <input
                autoFocus placeholder="Nombre de la categoría"
                onKeyDown={(e) => e.key === 'Enter' && handleAgregarCategoria((e.target as HTMLInputElement).value)}
                className="bg-[#0d0d0d] border border-[#252525] rounded px-3 py-2 text-white flex-1"
              />
              <button
                onClick={() => setAdding(false)}
                className="px-4 py-2 rounded border border-[#252525] text-white"
              >
                Cancelar
              </button>
              <button
                onClick={(e) => {
                  const input = (e.target as HTMLElement).closest('div')?.querySelector('input');
                  if (input) handleAgregarCategoria(input.value);
                }}
                className="px-4 py-2 rounded bg-violet-600 text-white"
              >
                Añadir
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#101010] border border-dashed border-[#252525] text-[#676b67] hover:text-violet-400"
            >
              <Plus size={20} /> Añadir categoría
            </button>
          )}
        </div>
      )}

      {tab === 'platos' && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-[#676b67] text-xs uppercase border-b border-[#252525]">
                <tr>
                  <th className="pb-4 pl-4">Plato</th>
                  <th className="pb-4">Categoría</th>
                  <th className="pb-4">Precio</th>
                  <th className="pb-4">Disponibilidad</th>
                  <th className="pb-4 pr-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252525]">
                {dishes.map((dish) => (
                  <tr key={dish.id} className="hover:bg-[#101010]">
                    <td className="py-4 pl-4 text-white font-medium">{dish.name}</td>
                    <td className="py-4 text-[#676b67]">
                      {categorias.find(c => c.id === dish.categoryId)?.nombre || 'Sin categoría'}
                    </td>
                    <td className="py-4 text-white font-mono">${dish.price.toFixed(2)}</td>
                    <td className="py-4">
                      <AvailabilityBadge maxAvailable={dish.maxAvailable} />
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <button
                        onClick={() => {
                          setEditForm({ ...dish });
                          setEditing('plato');
                        }}
                        className="mr-3 text-[#676b67] hover:text-white"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteDishId(dish.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => {
              setEditForm({
                name: '',
                categoryId: categorias[0]?.id || '',
                price: 0,
                description: '',
                imageUrl: '',
                recipe: [],
              });
              setEditing('plato');
            }}
            className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#101010] border border-dashed border-[#252525] text-[#676b67] hover:text-violet-400"
          >
            <Plus size={20} /> Añadir plato
          </button>
        </div>
      )}

      {tab === 'recetas' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dishes.map((dish) => (
              <div key={dish.id} className="bg-[#101010] border border-[#252525] rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{dish.name}</h3>
                  <button
                    onClick={() => {
                      setEditForm({ ...dish });
                      setEditing('plato');
                    }}
                    className="text-[#676b67] hover:text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="mb-2">
                  <AvailabilityBadge maxAvailable={dish.maxAvailable} />
                </div>
                <p className="text-[#676b67] text-sm mb-4">
                  {dish.recipe.length} ingredientes en receta
                </p>
                <div className="space-y-2">
                  {dish.recipe.slice(0, 3).map((ing, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-[#676b67]">{ing.ingredientName}</span>
                      <span className="text-white">{ing.quantity} {ing.unit}</span>
                    </div>
                  ))}
                  {dish.recipe.length > 3 && (
                    <p className="text-[#676b67] text-xs">+{dish.recipe.length - 3} más...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setEditForm({
                name: '',
                categoryId: categorias[0]?.id || '',
                price: 0,
                description: '',
                imageUrl: '',
                recipe: [],
              });
              setEditing('plato');
            }}
            className="mt-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#101010] border border-dashed border-[#252525] text-[#676b67] hover:text-violet-400"
          >
            <Plus size={20} /> Añadir receta
          </button>
        </div>
      )}

      {editing && editForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-end z-50">
          <div className="w-full max-w-2xl h-full bg-[#0d0d0d] border-l border-[#252525] p-8 overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">
                {editForm.id ? `Editar ${editing === 'categoria' ? 'categoría' : 'plato'}` : `Nuevo ${editing === 'categoria' ? 'categoría' : 'plato'}`}
              </h2>
              <button onClick={() => { setEditing(null); setEditForm(null); }} className="text-[#676b67] hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-6">
              {editing === 'categoria' && (
                <>
                  <div>
                    <label className="text-sm text-[#676b67] mb-2 block">Nombre de la categoría</label>
                    <input
                      type="text"
                      value={editForm.nombre || ''}
                      onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                      className="w-full bg-[#101010] border border-[#252525] rounded-xl px-4 py-3 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Activa</span>
                    <input
                      type="checkbox"
                      checked={editForm.activa !== false}
                      onChange={(e) => setEditForm({ ...editForm, activa: e.target.checked })}
                      className="w-5 h-5"
                    />
                  </div>
                </>
              )}
              {editing === 'producto' && (
                <>
                  <div>
                    <label className="text-sm text-[#676b67] mb-2 block">Nombre del plato</label>
                    <input
                      type="text"
                      value={editForm.nombre || ''}
                      onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                      className="w-full bg-[#101010] border border-[#252525] rounded-xl px-4 py-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#676b67] mb-2 block">Categoría</label>
                    <select
                      value={editForm.categoria_id || ''}
                      onChange={(e) => setEditForm({ ...editForm, categoria_id: e.target.value })}
                      className="w-full bg-[#101010] border border-[#252525] rounded-xl px-4 py-3 text-white"
                    >
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-[#676b67] mb-2 block">Precio</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#676b67]">$</span>
                      <input
                        type="number"
                        step={0.5}
                        value={editForm.precio || 0}
                        onChange={(e) => setEditForm({ ...editForm, precio: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#101010] border border-[#252525] rounded-xl pl-10 pr-4 py-3 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-[#676b67] mb-2 block">Stock</label>
                    <input
                      type="number"
                      value={editForm.stock || 0}
                      onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#101010] border border-[#252525] rounded-xl px-4 py-3 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Disponible</span>
                    <input
                      type="checkbox"
                      checked={editForm.disponible !== false}
                      onChange={(e) => setEditForm({ ...editForm, disponible: e.target.checked })}
                      className="w-5 h-5"
                    />
                  </div>
                </>
              )}
              {editing === 'plato' && (
                <>
                  <div>
                    <label className="text-sm text-[#676b67] mb-2 block">Nombre del plato</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-[#101010] border border-[#252525] rounded-xl px-4 py-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#676b67] mb-2 block">Categoría</label>
                    <select
                      value={editForm.categoryId || ''}
                      onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                      className="w-full bg-[#101010] border border-[#252525] rounded-xl px-4 py-3 text-white"
                    >
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-[#676b67] mb-2 block">Precio</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#676b67]">$</span>
                      <input
                        type="number"
                        step={0.5}
                        value={editForm.price || 0}
                        onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#101010] border border-[#252525] rounded-xl pl-10 pr-4 py-3 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-[#676b67] mb-2 block">Descripción</label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full bg-[#101010] border border-[#252525] rounded-xl px-4 py-3 text-white"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-[#676b67]">Disponibilidad estimada:</span>
                    <AvailabilityBadge maxAvailable={liveMaxAvailable} />
                  </div>
                  <RecipeIngredientSelector
                    ingredients={editForm.recipe || []}
                    allStockIngredients={allIngredients}
                    onChange={(updatedIngredients) => setEditForm({ ...editForm, recipe: updatedIngredients })}
                  />
                </>
              )}
              <button
                onClick={handleGuardarForm}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 rounded-xl"
              >
                {editForm.id ? 'Guardar cambios' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && eliminarCategoria(deleteId)}
        message="¿Estás seguro de que quieres eliminar esta categoría?"
        dangerMessage="Se eliminarán todos los platos asociados a esta categoría."
      />

      <ConfirmDeleteModal
        isOpen={!!deleteProductoId} onClose={() => setDeleteProductoId(null)}
        onConfirm={() => deleteProductoId && eliminarProducto(deleteProductoId)}
        message="¿Estás seguro de que quieres eliminar este plato?"
        dangerMessage="Esta acción no se puede deshacer."
      />

      <ConfirmDeleteModal
        isOpen={!!deleteDishId} onClose={() => setDeleteDishId(null)}
        onConfirm={() => deleteDishId && deleteDish(deleteDishId)}
        message="¿Estás seguro de que quieres eliminar este plato?"
        dangerMessage="Esta acción no se puede deshacer."
      />
    </div>
  );
}
