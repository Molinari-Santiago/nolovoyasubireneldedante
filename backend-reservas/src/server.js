import { env } from "./config/env.js";
import app from "./app.js";

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
