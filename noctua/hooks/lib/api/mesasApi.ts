import { apiFetch } from "./client";
import type { Mesa, EstadoMesa } from "@/types/mesa";

interface MesaBackend {
  id: number;
  numero: number;
  capacidad: number;
  ubicacion?: string | null;
  disponible?: boolean;
  estado?: string;
}

type RespuestaMesas =
  | MesaBackend[]
  | {
      mesas?: MesaBackend[];
      data?: MesaBackend[];
      results?: MesaBackend[];
    };

function mapEstadoMesa(mesa: MesaBackend): EstadoMesa {
  if (mesa.disponible === true) return "libre";
  if (mesa.disponible === false) return "ocupada";

  if (mesa.estado === "libre") return "libre";
  if (mesa.estado === "ocupada") return "ocupada";
  if (mesa.estado === "esperando_pedido") return "esperando_pedido";
  if (mesa.estado === "pedido_listo") return "pedido_listo";
  if (mesa.estado === "esperando_pago") return "esperando_pago";
  if (mesa.estado === "problema") return "problema";

  return "libre";
}

function mapMesaBackendToFrontend(mesa: MesaBackend): Mesa {
  return {
    id: String(mesa.id),
    numero: mesa.numero,
    zona: mesa.ubicacion || "SALÓN PRINCIPAL",
    estado: mapEstadoMesa(mesa),
    capacidad: mesa.capacidad,
    posicion: { x: 0, y: 0 },
    mesasUnidas: [],
  };
}

export async function obtenerMesas(): Promise<Mesa[]> {
  const respuesta = await apiFetch<RespuestaMesas>("/mesas");

  let mesasBackend: MesaBackend[] = [];

  if (Array.isArray(respuesta)) {
    mesasBackend = respuesta;
  } else if (Array.isArray(respuesta.mesas)) {
    mesasBackend = respuesta.mesas;
  } else if (Array.isArray(respuesta.data)) {
    mesasBackend = respuesta.data;
  } else if (Array.isArray(respuesta.results)) {
    mesasBackend = respuesta.results;
  } else {
    console.error("Respuesta inesperada del backend:", respuesta);
    throw new Error("El backend no devolvió una lista de mesas");
  }

  return mesasBackend.map(mapMesaBackendToFrontend);
}

export async function crearMesa(data: {
  numero: number;
  capacidad: number;
  ubicacion: string;
}) {
  return apiFetch("/mesas", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
export async function eliminarMesa(id: string) {
  return apiFetch(`/mesas/${id}`, {
    method: "DELETE",
  });
}