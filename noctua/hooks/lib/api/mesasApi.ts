import { supabase } from "../supabaseClient";
import type { Mesa, EstadoMesa } from "@/types/mesa";

interface MesaBackend {
  id: number;
  numero: number;
  capacidad: number;
  ubicacion?: string | null;
  zona?: string | null;
  disponible?: boolean;
  estado?: string;

  estadoActual?: string;
  estadoPedido?: string | null;
  pedidoActual?: unknown;
  reservaActual?: unknown;

  pos_x?: number | null;
  pos_y?: number | null;
  personas?: number | null;
  pedido_id?: number | null;
  creada_en?: string | null;
}

function mapEstadoMesa(mesa: MesaBackend): EstadoMesa {
  if (mesa.estadoActual === "OCUPADA") return "ocupada";
  if (mesa.estadoActual === "RESERVADA") return "esperando_pedido";
  if (mesa.estadoActual === "FUERA_DE_SERVICIO") return "problema";

  if (mesa.estadoPedido === "PENDIENTE") return "esperando_pedido";
  if (mesa.estadoPedido === "PREPARANDO") return "ocupada";
  if (mesa.estadoPedido === "LISTO") return "pedido_listo";

  if (mesa.disponible === true) return "libre";
  if (mesa.disponible === false) return "problema";

  if (mesa.estado === "libre") return "libre";
  if (mesa.estado === "ocupada") return "ocupada";
  if (mesa.estado === "esperando_pedido") return "esperando_pedido";
  if (mesa.estado === "pedido_listo") return "pedido_listo";
  if (mesa.estado === "esperando_pago") return "esperando_pago";
  if (mesa.estado === "problema") return "problema";

  return "libre";
}

export async function obtenerMesas(): Promise<Mesa[]> {
  const { data, error } = await supabase.from("mesas").select("*");

  if (error) {
    console.error("Error al obtener mesas de Supabase:", error);
    throw new Error(error.message);
  }

  return (data || []).map((mesa: MesaBackend) => ({
    id: String(mesa.id),
    numero: mesa.numero,
    zona: mesa.zona || mesa.ubicacion || "SALÓN PRINCIPAL",
    estado: mapEstadoMesa(mesa),
    capacidad: mesa.capacidad || 4,
    posicion: {
      x: mesa.pos_x || 0,
      y: mesa.pos_y || 0,
    },
    mesasUnidas: [],
    personas: mesa.personas || undefined,
    pedidoId: mesa.pedido_id ? String(mesa.pedido_id) : undefined,
    timerInicio: mesa.creada_en ? new Date(mesa.creada_en) : undefined,
  }));
}

export async function crearMesa(data: {
  numero: number;
  capacidad: number;
  ubicacion: string;
}) {
  const { data: newMesa, error } = await supabase
    .from("mesas")
    .insert([
      {
        numero: data.numero,
        capacidad: data.capacidad,
        zona: data.ubicacion,
        estado: "libre",
        pos_x: 0,
        pos_y: 0,
        forma: "cuadrada",
        piso: "baja",
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error al crear mesa:", error);
    throw new Error(error.message);
  }

  return {
    success: true,
    mesa: {
      id: String(newMesa.id),
      numero: newMesa.numero,
      zona: newMesa.zona || "SALÓN PRINCIPAL",
      estado: mapEstadoMesa(newMesa),
      capacidad: newMesa.capacidad || 4,
      posicion: {
        x: newMesa.pos_x || 0,
        y: newMesa.pos_y || 0,
      },
      mesasUnidas: [],
    },
  };
}