'use client';

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Trash2, ShoppingBag, ChevronRight } from 'lucide-react';
import { usePedidosStore } from '@/store/pedidosStore';
import { useMesasStore } from '@/store/mesasStore';
import { useStockStore } from '@/store/stockStore';
import { Button } from '@/components/ui/Button';
import { formatARS, cn } from '@/hooks/lib/utils';

// ── Producto Item ──────────────────────────────────────────────────────────────

const ProductoItem = memo(function ProductoItem({
  producto,
  onAdd,
}: {
  producto: { id: string; nombre: string; precio: number; disponible: boolean };
  onAdd: (id: string, nombre: string, precio: number) => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      disabled={!producto.disponible}
      onClick={() => onAdd(producto.id, producto.nombre, producto.precio)}
      aria-label={`Agregar ${producto.nombre} al pedido`}
      className={cn(
        'w-full text-left p-4 rounded-xl border transition-all duration-150 group',
        producto.disponible
          ? 'bg-[#0f0f0f] border-[#1e1e1e] hover:border-[#3a3a3a] hover:bg-[#141414] active:scale-[0.98]'
          : 'bg-[#0a0a0a] border-[#111] opacity-40 cursor-not-allowed'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{producto.nombre}</p>
          <p className="text-[#676B67] text-xs font-mono mt-0.5">{formatARS(producto.precio)}</p>
          {!producto.disponible && (
            <p className="text-red-400 text-xs mt-0.5">Sin stock</p>
          )}
        </div>
        <div className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
          producto.disponible
            ? 'bg-[#1a1a1a] group-hover:bg-white group-hover:text-black text-[#676B67]'
            : 'bg-[#111] text-[#2a2a2a]'
        )}>
          <Plus size={14} />
        </div>
      </div>
    </motion.button>
  );
});

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function PedidoPage() {
  const router = useRouter();
  const [categoriaActiva, setCategoriaActiva] = useState<string>('');
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState<string>('');

  const mesas = useMesasStore((s) => s.mesas);
  const cargarMesas = useMesasStore((s) => s.cargarMesas);
  const productos = useStockStore((s) => s.productos);
  const categorias = useStockStore((s) => s.categorias);
  const cargarCategorias = useStockStore((s) => s.cargarCategorias);
  const cargarProductos = useStockStore((s) => s.cargarProductos);

  useEffect(() => {
    cargarMesas();
    cargarCategorias().then(() => cargarProductos());
  }, [cargarMesas, cargarCategorias, cargarProductos]);

  useEffect(() => {
    if (!categoriaActiva && categorias.length > 0) {
      setCategoriaActiva(categorias[0].id);
    }
  }, [categorias, categoriaActiva]);

  const {
    pedidoActual,
    iniciarPedido,
    agregarItem,
    quitarItem,
    cambiarCantidad,
    cancelarPedido,
    enviarPedido,
    mesaActivaId,
  } = usePedidosStore();

  const mesaActiva = mesas.find((m) => m.id === (mesaActivaId ?? mesaSeleccionadaId));

  const productosFiltrados = useMemo(
    () => productos.filter((p) => p.categoria_id === categoriaActiva),
    [productos, categoriaActiva]
  );

  const handleSeleccionarMesa = (mesaId: string) => {
    setMesaSeleccionadaId(mesaId);
    const mesa = mesas.find((m) => m.id === mesaId);
    if (mesa) {
      iniciarPedido(mesa.id, mesa.numero, mesa.zona, mesa.personas ?? 1);
    }
  };

  const handleAgregar = useCallback((id: string, nombre: string, precio: number) => {
    if (!mesaActiva) return;
    if (!pedidoActual) {
      iniciarPedido(mesaActiva.id, mesaActiva.numero, mesaActiva.zona, mesaActiva.personas ?? 1);
    }
    agregarItem({ productoId: id, nombre, cantidad: 1, precioUnitario: precio });
  }, [mesaActiva, pedidoActual, iniciarPedido, agregarItem]);

  const handleEnviar = async () => {
    const pedido = await enviarPedido();
    if (pedido) {
      router.push('/dashboard/cocina');
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* ── Columna Izquierda: Categorías ── */}
      <div className="w-40 flex-shrink-0 flex flex-col gap-2">
        <p className="text-xs font-semibold text-[#676B67] tracking-widest uppercase px-1 mb-1">
          Categoría
        </p>
        {categorias.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoriaActiva(cat.id)}
            aria-pressed={categoriaActiva === cat.id}
            className={cn(
              'w-full py-3 px-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-150 text-left capitalize',
              categoriaActiva === cat.id
                ? 'bg-white text-black'
                : 'bg-[#0f0f0f] border border-[#1a1a1a] text-[#676B67] hover:text-white hover:border-[#2a2a2a]'
            )}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* ── Columna Central: Productos ── */}
      <div className="flex-1 min-w-0 overflow-y-auto space-y-2 pr-1">
        <div className="flex items-center justify-between px-1 mb-3">
          <h3 className="font-display text-xl tracking-widest text-[#BCB9B9] uppercase">
            {categorias.find(c => c.id === categoriaActiva)?.nombre || ''}
          </h3>
          <span className="text-xs text-[#676B67]">{productosFiltrados.length} productos</span>
        </div>
        <AnimatePresence mode="popLayout">
          {productosFiltrados.map((p) => (
            <ProductoItem
              key={p.id}
              producto={p}
              onAdd={handleAgregar}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ── Columna Derecha: Resumen ── */}
      <div className="w-72 flex-shrink-0 flex flex-col bg-[#080808] border border-[#1a1a1a] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={16} className="text-[#676B67]" />
            <span className="text-xs font-semibold text-[#676B67] tracking-widest uppercase">Pedido</span>
          </div>
          {/* Mesa selector */}
          <select
            value={mesaActivaId ?? mesaSeleccionadaId}
            onChange={(e) => handleSeleccionarMesa(e.target.value)}
            aria-label="Seleccionar mesa para el pedido"
            className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#676B67]"
          >
            <option value="">— Seleccionar mesa —</option>
            {mesas
              .map((m) => (
                <option key={m.id} value={m.id}>
                  Mesa {m.numero} — {m.zona}
                </option>
              ))}
          </select>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(!pedidoActual || pedidoActual.items.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <ShoppingBag size={32} className="text-[#2a2a2a] mb-3" />
              <p className="text-[#3a3a3a] text-sm">
                {mesaActiva ? 'Agregá productos al pedido' : 'Seleccioná una mesa primero'}
              </p>
            </div>
          ) : (
            pedidoActual.items.map((item) => (
              <div key={item.productoId} className="flex items-center gap-2 py-2 border-b border-[#111]">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{item.nombre}</p>
                  <p className="text-[#676B67] text-xs font-mono">{formatARS(item.subtotal)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => cambiarCantidad(item.productoId, item.cantidad - 1)}
                    aria-label={`Reducir cantidad de ${item.nombre}`}
                    className="w-6 h-6 bg-[#1a1a1a] rounded text-white hover:bg-[#2a2a2a] flex items-center justify-center"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="w-6 text-center text-white text-sm font-bold">{item.cantidad}</span>
                  <button
                    onClick={() => cambiarCantidad(item.productoId, item.cantidad + 1)}
                    aria-label={`Aumentar cantidad de ${item.nombre}`}
                    className="w-6 h-6 bg-[#1a1a1a] rounded text-white hover:bg-[#2a2a2a] flex items-center justify-center"
                  >
                    <Plus size={10} />
                  </button>
                  <button
                    onClick={() => quitarItem(item.productoId)}
                    aria-label={`Eliminar ${item.nombre} del pedido`}
                    className="w-6 h-6 ml-1 text-[#676B67] hover:text-red-400 flex items-center justify-center"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total + Actions */}
        <div className="p-4 border-t border-[#1a1a1a] space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#676B67] tracking-widest uppercase">Total</span>
            <span className="text-white font-bold font-mono text-lg">
              {formatARS(pedidoActual?.total ?? 0)}
            </span>
          </div>
          <Button
            variant="primary"
            className="w-full"
            disabled={!pedidoActual || pedidoActual.items.length === 0}
            onClick={handleEnviar}
            aria-label="Enviar pedido a cocina"
          >
            Enviar a cocina
            <ChevronRight size={14} />
          </Button>
          {pedidoActual && pedidoActual.items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={cancelarPedido}
              aria-label="Cancelar pedido actual"
            >
              Cancelar pedido
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
