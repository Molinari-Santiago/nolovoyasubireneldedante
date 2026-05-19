"use client";

import { memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, TrendingUp } from "lucide-react";
import { useStockStore } from "@/store/stockStore";
import { Toggle } from "@/components/ui/Toggle";
import { CATEGORIAS_LABELS } from "@/hooks/lib/constants";
import { formatARS, cn } from "@/hooks/lib/utils";
import type { CategoriaProducto, Producto } from "@/types/producto";

const CATEGORIAS: CategoriaProducto[] = [
  "cafeteria",
  "restaurante",
  "bebidas",
  "combos",
];

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
  const categoriaActiva = useStockStore((s) => s.categoriaActiva);
  const setCategoriaActiva = useStockStore((s) => s.setCategoriaActiva);
  const modificarStock = useStockStore((s) => s.modificarStock);
  const toggleDisponibilidad = useStockStore((s) => s.toggleDisponibilidad);
  const getProductosPorCategoria = useStockStore(
    (s) => s.getProductosPorCategoria
  );
  const getTotalValorizado = useStockStore((s) => s.getTotalValorizado);
  const getTotalPorCategoria = useStockStore((s) => s.getTotalPorCategoria);

  const cargarProductos = useStockStore((s) => s.cargarProductos);
  const isLoading = useStockStore((s) => s.isLoading);
  const error = useStockStore((s) => s.error);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const productosFiltrados = getProductosPorCategoria(categoriaActiva);
  const totalGeneral = getTotalValorizado();

  if (isLoading) {
    return (
      <div className="text-[#BCB9B9]">
        Cargando productos desde el backend...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="flex gap-5 h-[calc(100vh-8rem)]">
      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-1">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              aria-pressed={categoriaActiva === cat}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-bold tracking-widest uppercase transition-all duration-150",
                categoriaActiva === cat
                  ? "bg-white text-black"
                  : "text-[#676B67] hover:text-white"
              )}
            >
              {CATEGORIAS_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={categoriaActiva}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
            >
              {productosFiltrados.map((p) => (
                <StockCard
                  key={p.id}
                  producto={p}
                  onModificar={modificarStock}
                  onToggle={toggleDisponibilidad}
                />
              ))}
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
          {CATEGORIAS.map((cat) => {
            const total = getTotalPorCategoria(cat);
            const prods = getProductosPorCategoria(cat);
            const disponibles = prods.filter((p) => p.disponible).length;

            return (
              <div key={cat} className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-[#BCB9B9] font-semibold">
                    {CATEGORIAS_LABELS[cat]}
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
  );
}