"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Plus } from "lucide-react";
import { useMesasStore } from "@/store/mesasStore";
import { MesaCard } from "@/components/mesas/MesaCard";
import { MesaModal } from "@/components/mesas/MesaModal";
import { Button } from "@/components/ui/Button";
import { DotBadge } from "@/components/ui/Badge";
import { COLORES_ESTADO_MESA, TEXTO_ESTADO_MESA } from "@/hooks/lib/constants";
import type { Mesa, EstadoMesa } from "@/types/mesa";

const ZONAS_LAYOUT = [
  "TERRAZA EXTERIOR",
  "SALÓN PRINCIPAL",
  "BAR",
  "ZONA SOFÁS",
  "ZONA COCINA",
];

const ESTADOS_LEYENDA: EstadoMesa[] = [
  "libre",
  "ocupada",
  "esperando_pedido",
  "pedido_listo",
  "esperando_pago",
  "problema",
];

export default function MesasPage() {
  const mesas = useMesasStore((s) => s.mesas);
  const mesasSeleccionadas = useMesasStore((s) => s.mesasSeleccionadas);
  const toggleSeleccionMesa = useMesasStore((s) => s.toggleSeleccionMesa);
  const limpiarSeleccion = useMesasStore((s) => s.limpiarSeleccion);
  const unirMesas = useMesasStore((s) => s.unirMesas);

  const cargarMesas = useMesasStore((s) => s.cargarMesas);
  const crearMesaDesdePanel = useMesasStore((s) => s.crearMesaDesdePanel);
  const isLoading = useMesasStore((s) => s.isLoading);
  const error = useMesasStore((s) => s.error);

  const [modalMesa, setModalMesa] = useState<Mesa | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [numeroMesa, setNumeroMesa] = useState("");
  const [capacidadMesa, setCapacidadMesa] = useState("");
  const [ubicacionMesa, setUbicacionMesa] = useState("SALÓN PRINCIPAL");

  useEffect(() => {
    cargarMesas();
  }, [cargarMesas]);

  const handleCrearMesa = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const numero = Number(numeroMesa);
    const capacidad = Number(capacidadMesa);

    if (!numero || numero <= 0) {
      alert("Ingresá un número de mesa válido");
      return;
    }

    if (!capacidad || capacidad <= 0) {
      alert("Ingresá una capacidad válida");
      return;
    }

    await crearMesaDesdePanel({
      numero,
      capacidad,
      ubicacion: ubicacionMesa,
    });

    setNumeroMesa("");
    setCapacidadMesa("");
    setUbicacionMesa("SALÓN PRINCIPAL");
  };

  const handleSingleClick = useCallback(
    (id: string) => {
      toggleSeleccionMesa(id);
    },
    [toggleSeleccionMesa]
  );

  const handleDoubleClick = useCallback(
    (mesa: Mesa) => {
      setModalMesa(mesa);
      setModalOpen(true);
      limpiarSeleccion();
    },
    [limpiarSeleccion]
  );

  const handleUnirMesas = () => {
    if (mesasSeleccionadas.length >= 2) {
      unirMesas(mesasSeleccionadas);
    }
  };

  const getMesasPorZona = (zona: string) =>
    mesas.filter((m) => m.zona === zona);

  return (
    <div className="space-y-6">
      {/* Formulario para agregar mesas */}
      <form
        onSubmit={handleCrearMesa}
        className="bg-[#080808] border border-[#1a1a1a] rounded-xl p-5 space-y-4"
      >
        <div>
          <h2 className="text-white font-bold tracking-widest uppercase">
            Agregar mesa
          </h2>
          <p className="text-[#676B67] text-sm">
            Crea una mesa nueva y la guarda en el backend.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#676B67] uppercase font-semibold">
              Número
            </label>
            <input
              type="number"
              value={numeroMesa}
              onChange={(e) => setNumeroMesa(e.target.value)}
              placeholder="Ej: 1"
              className="bg-black border border-[#2a2a2a] rounded-md px-3 py-2 text-white outline-none focus:border-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#676B67] uppercase font-semibold">
              Capacidad
            </label>
            <input
              type="number"
              value={capacidadMesa}
              onChange={(e) => setCapacidadMesa(e.target.value)}
              placeholder="Ej: 4"
              className="bg-black border border-[#2a2a2a] rounded-md px-3 py-2 text-white outline-none focus:border-white"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#676B67] uppercase font-semibold">
              Ubicación
            </label>
            <select
              value={ubicacionMesa}
              onChange={(e) => setUbicacionMesa(e.target.value)}
              className="bg-black border border-[#2a2a2a] rounded-md px-3 py-2 text-white outline-none focus:border-white"
            >
              <option value="SALÓN PRINCIPAL">SALÓN PRINCIPAL</option>
              <option value="TERRAZA EXTERIOR">TERRAZA EXTERIOR</option>
              <option value="BAR">BAR</option>
              <option value="ZONA SOFÁS">ZONA SOFÁS</option>
              <option value="ZONA COCINA">ZONA COCINA</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isLoading}
            >
              <Plus size={14} />
              Agregar mesa
            </Button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>

      {/* Selection toolbar */}
      <AnimatePresence>
        {mesasSeleccionadas.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg"
          >
            <span className="text-blue-400 text-sm font-semibold">
              {mesasSeleccionadas.length} mesas seleccionadas
            </span>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleUnirMesas}
              aria-label="Unir mesas seleccionadas"
            >
              <Link2 size={14} />
              Unir mesas
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={limpiarSeleccion}
              aria-label="Cancelar selección"
            >
              Cancelar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && mesas.length === 0 && (
        <div className="text-[#BCB9B9]">
          Cargando mesas desde el backend...
        </div>
      )}

      {/* Zones grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ZONAS_LAYOUT.map((zona) => {
          const mesasZona = getMesasPorZona(zona);

          if (mesasZona.length === 0) return null;

          return (
            <div
              key={zona}
              className="bg-[#080808] border border-[#1a1a1a] rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg tracking-widest text-[#BCB9B9] uppercase">
                  {zona}
                </h3>

                <span className="text-xs text-[#676B67]">
                  {mesasZona.filter((m) => m.estado !== "libre").length}/
                  {mesasZona.length} ocupadas
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {mesasZona.map((mesa) => (
                  <MesaCard
                    key={mesa.id}
                    mesa={mesa}
                    isSelected={mesasSeleccionadas.includes(mesa.id)}
                    onSingleClick={handleSingleClick}
                    onDoubleClick={handleDoubleClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
   {/* Legend */}
<div className="fixed bottom-6 right-6 w-[320px] bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-4 shadow-2xl z-20">
  <p className="text-xs font-semibold text-[#676B67] tracking-widest uppercase mb-3">
    Estados
  </p>

  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
    {ESTADOS_LEYENDA.map((estado) => (
      <DotBadge
        key={estado}
        color={COLORES_ESTADO_MESA[estado]}
        label={TEXTO_ESTADO_MESA[estado]}
        className="whitespace-nowrap"
      />
    ))}
  </div>

  <p className="text-[#2a2a2a] text-xs mt-4 font-mono leading-relaxed">
    Click = seleccionar
    <br />
    2× click = gestionar
  </p>
</div>

      {/* Mesa Modal */}
      <MesaModal
        mesa={modalMesa}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalMesa(null);
        }}
      />
    </div>
  );
}