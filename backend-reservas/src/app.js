import express from "express";
import cors from "cors";

import mesasRoutes from "./routes/mesas.routes.js";
import reservasRoutes from "./routes/reservas.routes.js";
import productosRoutes from "./routes/productos.routes.js";
import pedidosRoutes from "./routes/pedidos.routes.js";

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

export default app;