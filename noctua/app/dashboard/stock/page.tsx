"use client";

import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, TrendingUp, X, PackagePlus } from "lucide-react";
import { useStockStore } from "@/store/stockStore";
import { Toggle } from "@/components/ui/Toggle";
import { formatARS, cn } from "@/hooks/lib/utils";
import type { Producto } from "@/types/producto";

// ── Modal Nuevo Producto ───────────────────────────────────────────────────────

function ModalNuevoProducto({
  onClose,
  categoriaInicial,
}: {
  onClose: () => void;
  categoriaInicial: string | null;
}) {
  const agregarProducto = useStockStore((s) => s.agregarProducto);
  const isLoading = useStockStore((s) => s.isLoading);
  const categorias = useStockStore((s) => s.categorias);

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("0");
  const [categoriaId, setCategoriaId] = useState<string>(
    categoriaInicial || (categorias.length > 0 ? categorias[0].id : "")
  );
  const [disponible, setDisponible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (!categoriaId) return setError("Debes seleccionar una categoría.");
    const precioNum = parseFloat(precio.replace(",", "."));
    if (isNaN(precioNum) || precioNum < 0) return setError("Precio inválido.");
    const stockNum = parseInt(stock);
    if (isNaN(stockNum) || stockNum < 0) return setError("Stock inválido.");

    try {
      setGuardando(true);
      await agregarProducto({
        nombre: nombre.trim(),
        precio: precioNum,
        categoria_id: categoriaId,
        stock: stockNum,
        disponible,
      });
      onClose();
    } catch {
      setError("No se pudo guardar el producto. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <PackagePlus size={18} className="text-white" />
            <h2 className="text-white font-bold text-base tracking-wide">
              Nuevo Producto
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1a1a1a] text-[#676B67] hover:text-white hover:bg-[#2a2a2a] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label
              htmlFor="prod-nombre"
              className="block text-xs text-[#676B67] font-semibold tracking-widest uppercase mb-1.5"
            >
              Nombre
            </label>
            <input
              id="prod-nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Café con leche"
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#3a3a3a] transition-colors"
            />
          </div>

          {/* Precio + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="prod-precio"
                className="block text-xs text-[#676B67] font-semibold tracking-widest uppercase mb-1.5"
              >
                Precio ($)
              </label>
              <input
                id="prod-precio"
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#3a3a3a] transition-colors"
              />
            </div>
            <div>
              <label
                htmlFor="prod-stock"
                className="block text-xs text-[#676B67] font-semibold tracking-widest uppercase mb-1.5"
              >
                Stock inicial
              </label>
              <input
                id="prod-stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3a3a3a] transition-colors"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label
              htmlFor="prod-categoria"
              className="block text-xs text-[#676B67] font-semibold tracking-widest uppercase mb-1.5"
            >
              Categoría
            </label>
            <select
              id="prod-categoria"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3a3a3a] transition-colors"
            >
              <option value="" disabled>Selecciona una categoría</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre.charAt(0).toUpperCase() + cat.nombre.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Disponible */}
          <div className="flex items-center justify-between bg-[#111] border border-[#1e1e1e] rounded-xl px-3 py-2.5">
            <span className="text-sm text-[#BCB9B9] font-medium">
              Disponible al crear
            </span>
            <Toggle
              checked={disponible}
              onChange={() => setDisponible((v) => !v)}
              aria-label="Disponibilidad inicial del producto"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#111] border border-[#2a2a2a] text-sm text-[#676B67] hover:text-white hover:border-[#3a3a3a] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || isLoading || categorias.length === 0}
              aria-label="Guardar nuevo producto"
              className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-[#e5e5e5] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Stock Card ────────────────────────────────────────────────────────────────

const StockCard = memo(function StockCard({
  producto,
  onModificar,
  onToggle,
}: {
  producto: Producto;
  onModificar: (id: string, delta: number) => void;
  onToggle: (id: string) => void;
}) {
  const stockMax = 100;
  const stockPct = Math.min(100, ((producto.stock ?? 0) / stockMax) * 100);
  const stockBajo = (producto.stock ?? 0) < 10;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-[#0a0a0a] border rounded-xl p-4 space-y-3 transition-all",
        producto.disponible ? "border-[#1a1a1a]" : "border-[#111] opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {producto.nombre}
          </p>

          <p className="text-[#676B67] font-mono text-xs mt-0.5">
            {formatARS(producto.precio)}
          </p>
        </div>

        <Toggle
          checked={producto.disponible}
          onChange={() => onToggle(producto.id)}
          aria-label={`${
            producto.disponible ? "Deshabilitar" : "Habilitar"
          } ${producto.nombre}`}
        />
      </div>

      {/* Stock controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onModificar(producto.id, -1)}
          disabled={(producto.stock ?? 0) <= 0}
          aria-label={`Reducir stock de ${producto.nombre}`}
          className="w-7 h-7 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          <Minus size={12} />
        </button>

        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span
              className={cn(
                "text-sm font-bold",
                stockBajo ? "text-red-400" : "text-white"
              )}
            >
              {producto.stock ?? 0}
            </span>

            <span className="text-[#676B67] text-xs">uds.</span>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${stockPct}%` }}
              transition={{ duration: 0.3 }}
              className={cn(
                "h-full rounded-full",
                stockBajo
                  ? "bg-red-500"
                  : stockPct > 50
                  ? "bg-green-500"
                  : "bg-yellow-400"
              )}
            />
          </div>
        </div>

        <button
          onClick={() => onModificar(producto.id, 1)}
          aria-label={`Aumentar stock de ${producto.nombre}`}
          className="w-7 h-7 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white hover:bg-[#2a2a2a] flex items-center justify-center transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>
    </motion.div>
  );
});

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function StockPage() {
  const productos = useStockStore((s) => s.productos);
  const categorias = useStockStore((s) => s.categorias);
  const categoriaActiva = useStockStore((s) => s.categoriaActiva);
  const setCategoriaActiva = useStockStore((s) => s.setCategoriaActiva);
  const modificarStock = useStockStore((s) => s.modificarStock);
  const toggleDisponibilidad = useStockStore((s) => s.toggleDisponibilidad);
  const getProductosPorCategoria = useStockStore(
    (s) => s.getProductosPorCategoria
  );
  const getTotalValorizado = useStockStore((s) => s.getTotalValorizado);
  const getTotalPorCategoria = useStockStore((s) => s.getTotalPorCategoria);

  const cargarCategorias = useStockStore((s) => s.cargarCategorias);
  const cargarProductos = useStockStore((s) => s.cargarProductos);
  const isLoading = useStockStore((s) => s.isLoading);
  const error = useStockStore((s) => s.error);

  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    // Cargar categorias primero, y luego productos
    cargarCategorias().then(() => cargarProductos());
  }, [cargarCategorias, cargarProductos]);

  const productosFiltrados = getProductosPorCategoria(categoriaActiva);
  const totalGeneral = getTotalValorizado();

  if (isLoading && productos.length === 0) {
    return (
      <div className="text-[#BCB9B9]">
        Cargando productos desde el backend...
      </div>
    );
  }

  if (error && productos.length === 0) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <>
      {/* Modal */}
      <AnimatePresence>
        {modalAbierto && (
          <ModalNuevoProducto
            onClose={() => setModalAbierto(false)}
            categoriaInicial={categoriaActiva}
          />
        )}
      </AnimatePresence>

      <div className="flex gap-5 h-[calc(100vh-8rem)]">
        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Tabs + Add button */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-1 overflow-x-auto">
              {categorias.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaActiva(cat.id)}
                  aria-pressed={categoriaActiva === cat.id}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-150 whitespace-nowrap",
                    categoriaActiva === cat.id
                      ? "bg-white text-black"
                      : "text-[#676B67] hover:text-white"
                  )}
                >
                  {cat.nombre}
                </button>
              ))}
            </div>

            {/* Nuevo producto */}
            <button
              onClick={() => setModalAbierto(true)}
              aria-label="Agregar nuevo producto al stock"
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-xl text-xs font-bold hover:bg-[#e5e5e5] active:scale-95 transition-all flex-shrink-0"
            >
              <Plus size={14} />
              Nuevo
            </button>
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={categoriaActiva || "empty"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
              >
                {productosFiltrados.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
                    <PackagePlus size={32} className="text-[#2a2a2a]" />
                    <p className="text-[#3a3a3a] text-sm">
                      No hay productos en esta categoría
                    </p>
                    <button
                      onClick={() => setModalAbierto(true)}
                      className="text-xs text-[#676B67] underline hover:text-white transition-colors"
                    >
                      Agregar el primero
                    </button>
                  </div>
                ) : (
                  productosFiltrados.map((p) => (
                    <StockCard
                      key={p.id}
                      producto={p}
                      onModificar={modificarStock}
                      onToggle={toggleDisponibilidad}
                    />
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Recuento lateral */}
        <div className="w-64 flex-shrink-0 bg-[#080808] border border-[#1a1a1a] rounded-xl p-5 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-[#676B67]" />

            <h3 className="text-xs font-semibold text-[#676B67] tracking-widest uppercase">
              Inventario
            </h3>
          </div>

          {/* Per category */}
          <div className="space-y-3">
            {categorias.map((cat) => {
              const total = getTotalPorCategoria(cat.id);
              const prods = getProductosPorCategoria(cat.id);
              const disponibles = prods.filter((p) => p.disponible).length;

              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-[#BCB9B9] font-semibold capitalize">
                      {cat.nombre}
                    </span>

                    <span className="text-xs text-[#676B67]">
                      {disponibles}/{prods.length}
                    </span>
                  </div>

                  <p className="text-white font-mono text-sm font-bold">
                    {formatARS(total)}
                  </p>

                  <div className="h-px bg-[#111]" />
                </div>
              );
            })}
          </div>

          {/* Total general */}
          <div className="mt-auto pt-4 border-t border-[#1e1e1e]">
            <p className="text-xs font-semibold text-[#676B67] tracking-widest uppercase mb-1">
              Total Valorizado
            </p>

            <p className="text-white font-mono text-xl font-black">
              {formatARS(totalGeneral)}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}