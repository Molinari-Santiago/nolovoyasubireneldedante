import express from "express";
import cors from "cors";

import mesasRoutes from "./routes/mesas.routes.js";
import reservasRoutes from "./routes/reservas.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import pedidosRoutes from "./routes/pedidos.routes.js";
import facturasRoutes from "./routes/facturas.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

app.use("/api/mesas", mesasRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/facturas", facturasRoutes);
app.use("/api/usuarios", usuariosRoutes);

export default app;
