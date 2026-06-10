import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Check, AlertCircle } from "lucide-react";
import { useStockStore } from "@/store/stockStore";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/hooks/lib/utils";
import type { StockCategory, Ingredient } from "@/types/stock";

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

interface AddIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: StockCategory[];
}

export const AddIngredientModal = ({ isOpen, onClose, categories }: AddIngredientModalProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState<string | undefined>();
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [quantity, setQuantity] = useState(20);
  const [unit, setUnit] = useState<"unidades" | "kg" | "litros">("unidades");
  const [errors, setErrors] = useState<{ name?: string; category?: string; quantity?: string }>({});
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const addIngredientStore = useStockStore((s) => s.addIngredient);

  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].name);
    }
  }, [categories]); // Removed 'category' from dependencies to prevent loop

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setCategory(categories.length > 0 ? categories[0].name : "");
      setSubcategory(undefined);
      setIsCreatingCategory(false);
      setNewCategoryName("");
      setQuantity(20);
      setUnit("unidades");
      setErrors({});
      setDuplicateWarning(false);
    }
  }, [isOpen, categories]);

  const validateForm = (): boolean => {
    const newErrors: { name?: string; category?: string; quantity?: string } = {};
    let isValid = true;

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
      isValid = false;
    }
    if (name.trim().length > 60) {
      newErrors.name = "El nombre no puede exceder los 60 caracteres";
      isValid = false;
    }

    const selectedCatName = isCreatingCategory ? newCategoryName : category;
    if (!selectedCatName.trim()) {
      newErrors.category = "Debes seleccionar o crear una categoría";
      isValid = false;
    }

    if (quantity < 0 || quantity > 9999) {
      newErrors.quantity = "La cantidad debe estar entre 0 y 9999";
      isValid = false;
    }

    // Check for duplicates
    if (isValid) {
      const selectedCategoryObj = categories.find((c) => c.name === selectedCatName);
      if (selectedCategoryObj) {
        const duplicate = selectedCategoryObj.ingredients.some(
          (i) => i.name.toLowerCase() === name.trim().toLowerCase()
        );
        setDuplicateWarning(duplicate);
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Simplified validity check that doesn't update state
  const isFormValid = () => {
    if (!name.trim() || name.trim().length < 2) return false;
    if (name.trim().length > 60) return false;
    
    const selectedCatName = isCreatingCategory ? newCategoryName : category;
    if (!selectedCatName.trim()) return false;
    
    if (quantity < 0 || quantity > 9999) return false;
    
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const finalCategory = isCreatingCategory ? newCategoryName.trim() : category;
    const minStock = unit === "unidades" ? 5 : 2;

    const newIngredient: Omit<Ingredient, "id" | "lastUpdated"> = {
      name: name.trim(),
      category: finalCategory,
      subcategory: subcategory,
      stock: quantity,
      unit: unit,
      minStock: minStock,
    };

    addIngredientStore(newIngredient);

    toast.success('Ingrediente añadido', `${newIngredient.name} añadido al stock`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1a1a1a]">
              <h2 className="text-white font-bold text-lg">Añadir producto</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1a1a] text-[#676b67] hover:text-white hover:bg-[#2a2a2a] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-[#676b67] mb-1.5">
                  Nombre del producto
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Aceite de coco"
                  maxLength={60}
                  className={cn(
                    "w-full bg-[#111] border rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#3a3a3a] focus:outline-none transition-colors",
                    errors.name ? "border-red-500" : "border-[#2a2a2a] focus:border-white"
                  )}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                {duplicateWarning && (
                  <div className="flex items-start gap-2 mt-1 text-yellow-400 text-xs">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>Ya existe un ingrediente con ese nombre en esta categoría. ¿Querés añadirlo de todas formas?</span>
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-[#676b67] mb-1.5">
                  Categoría / Tipo de producto
                </label>
                {isCreatingCategory ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nombre de la nueva categoría"
                      className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#3a3a3a] focus:outline-none focus:border-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategory(false)}
                      className="text-xs text-[#676b67] hover:text-white underline"
                    >
                      Volver a categorías existentes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategory(true)}
                      className="flex items-center gap-1 text-xs text-[#bcb9b9] hover:text-white"
                    >
                      <Plus size={14} />
                      Crear nueva categoría
                    </button>
                  </div>
                )}
                {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
              </div>

              {/* Quantity and Unit */}
              <div>
                <label className="block text-xs font-semibold tracking-widest uppercase text-[#676b67] mb-1.5">
                  Cantidad y unidad
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                      step={unit === "unidades" ? 1 : 0.5}
                      min={0}
                      max={9999}
                      className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors"
                    />
                    <div className="flex items-center gap-1 p-1 bg-[#111] border border-[#2a2a2a] rounded-xl">
                      {(["unidades", "kg", "litros"] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUnit(u)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                            unit === u
                              ? "bg-white text-black"
                              : "text-[#676b67] hover:text-white"
                          )}
                        >
                          {u === "unidades" ? "🔢 Unidades" : u === "kg" ? "⚖ kg" : "🥛 L"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#676b67]">
                    Ej: {unit === "unidades" ? "12 unidades" : `2.5 ${unit}`}
                  </p>
                  {errors.quantity && <p className="text-red-400 text-xs">{errors.quantity}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-[#111] border border-[#2a2a2a] text-sm text-[#676b67] hover:text-white hover:border-[#3a3a3a] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid() && !duplicateWarning}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-[#e5e5e5] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  Guardar producto
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
