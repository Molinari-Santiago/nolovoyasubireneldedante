const ROLES_FACTURACION = new Set(["admin", "cajero"]);

export function obtenerUsuarioRequest(req) {
  return {
    rol: String(req.headers["x-noctua-role"] || req.headers["x-user-role"] || "")
      .trim()
      .toLowerCase(),
    nombre: String(req.headers["x-noctua-user"] || req.headers["x-user-name"] || "")
      .trim(),
    id: String(req.headers["x-noctua-user-id"] || req.headers["x-user-id"] || "")
      .trim(),
  };
}

export function tienePermisoFacturacion(req) {
  const usuario = obtenerUsuarioRequest(req);
  return ROLES_FACTURACION.has(usuario.rol);
}

export function rechazarSinPermisoFacturacion(req, res) {
  if (tienePermisoFacturacion(req)) return false;

  res.status(403).json({
    mensaje: "No tenes permisos para acceder al modulo de facturacion",
  });
  return true;
}
