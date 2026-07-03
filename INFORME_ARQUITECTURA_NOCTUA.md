# Informe de arquitectura NOCTUA

Fecha de analisis: 2026-07-02

Alcance: analisis estatico del repositorio local. No se ejecutaron migraciones, seeds ni scripts que modifiquen datos. No se copiaron valores de archivos `.env`.

## 1. Resumen general

NOCTUA es un proyecto con frontend Next.js y backend Express para gestion de restaurante: mesas, pedidos, cocina, stock, platos, promociones, reservas, facturacion, cuentas corrientes, usuarios, soporte, delivery y panel superadmin.

Tecnologias principales:

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, TanStack React Query, Framer Motion, Lucide, Recharts.
- Backend: Node.js ESM, Express, CORS, dotenv, Supabase Admin, ExcelJS.
- Base de datos: Supabase/Postgres para la aplicacion actual; Prisma con SQLite existe en `backend-reservas/prisma/`, pero no aparece usado por `backend-reservas/src/`.
- Autenticacion: frontend operativo usa Zustand persistido y cookie `noctua-auth`; superadmin usa cookie `superadm_session`; algunas API routes usan Supabase Admin con `SUPABASE_SERVICE_ROLE_KEY=[OCULTO]`.
- Integraciones externas: Supabase, Resend para soporte, delivery adapters para Glovo/Rappi/PedidosYa/Uber Eats, ARCA simulado, Excel, exportacion PDF/CSV de dashboard.
- Comandos principales:
  - `backend-reservas`: `npm run dev`, `npm start`.
  - `noctua`: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`, `npm run clean`.
  - raiz: no define scripts.

Variables sensibles vistas por nombre, sin valores:

```env
SUPABASE_URL=[CONFIGURADO]
SUPABASE_SERVICE_ROLE_KEY=[OCULTO]
NEXT_PUBLIC_SUPABASE_URL=[CONFIGURADO]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[OCULTO]
NEXT_PUBLIC_API_URL=[CONFIGURADO]
DATABASE_URL=[CONFIGURADO]
PORT=[CONFIGURADO]
ARCA_MODO=[CONFIGURADO]
ARCA_CUIT=[OCULTO]
ARCA_PUNTO_VENTA=[CONFIGURADO]
SUPERADM_PIN=[OCULTO]
RESEND_API_KEY=[OCULTO]
RESEND_SUPPORT_EMAIL=[OCULTO]
RESEND_FROM_EMAIL=[CONFIGURADO]
UBEREATS_CLIENT_ID=[OCULTO]
UBEREATS_CLIENT_SECRET=[OCULTO]
RAPPI_BEARER_TOKEN=[OCULTO]
PEDIDOSYA_API_KEY=[OCULTO]
GLOVO_API_KEY=[OCULTO]
```

## 2. Package.json

| Ubicacion | Scripts | Dependencias principales | Dependencia que parece no utilizarse | Node esperado |
| --- | --- | --- | --- | --- |
| `package.json` | Ninguno | `@tanstack/react-query`, `cors`, `@types/node` | Las tres parecen residuales en la raiz; las apps tienen sus propios paquetes | No declarado |
| `backend-reservas/package.json` | `dev`, `start` | `express`, `cors`, `dotenv`, `@supabase/supabase-js`, `exceljs` | `soap` no aparece importado; Prisma se usa en `prisma/seed.js` pero no esta declarado como dependencia | No declarado; por ESM y Next separado conviene Node 20+ |
| `noctua/package.json` | `dev`, `build`, `start`, `lint`, `clean` | `next`, `react`, `react-dom`, `zustand`, `@tanstack/react-query`, `@supabase/supabase-js`, `framer-motion`, `lucide-react`, `recharts`, `resend`, `html2canvas`, `jspdf` | No hay una dependencia claramente sobrante: `html2canvas` y `jspdf` se importan dinamicamente en `utils/exportDashboard.ts`; DnD, Recharts, Resend, Zustand y Query se usan | No declarado; Next 16 normalmente requiere Node moderno |

No se copiaron `package-lock.json` completos.

## 3. Backend

Punto de inicio:

- `backend-reservas/src/server.js`: carga `env`, importa `app`, escucha en `env.port` y maneja `EADDRINUSE`.

Configuracion Express:

- `backend-reservas/src/app.js`
- Middlewares:
  - `cors` con origen permitido para `localhost`.
  - `express.json()`.
- Rutas registradas:
  - `/api/mesas`
  - `/api/reservas`
  - `/api/productos`
  - `/api/pedidos`
  - `/api/facturas`
  - `/api/usuarios`
  - `/api/categorias`

Configuracion:

- `backend-reservas/src/config/env.js`: carga `.env` y `.env.local`; requiere `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
- `backend-reservas/src/config/supabaseAdmin.js`: crea cliente Supabase Admin con variables de entorno.

Autenticacion y autorizacion:

- No hay middleware global de auth en Express.
- Facturacion usa `backend-reservas/src/utils/authz.js` para leer headers `X-Noctua-Role`, `X-User-Role`, `X-Noctua-User`, `X-User-Name`.
- Permiso de facturacion limitado a roles `admin` y `cajero`.
- Muchas rutas no tienen validacion de sesion en backend.

Manejo de errores:

- Controladores usan `try/catch` y responden JSON con `mensaje` y `error`.
- No hay middleware central de errores.

Prisma:

- Existe `backend-reservas/prisma/schema.prisma` con datasource SQLite.
- Modelos: `Mesa`, `Reserva`, `Producto`, `Pedido`, `DetallePedido`, `Factura`.
- Enums: `EstadoReserva`, `EstadoPedido`, `EstadoFactura`.
- Migraciones historicas bajo `backend-reservas/prisma/migrations/`.
- `backend-reservas/prisma/seed.js` usa `PrismaClient`, pero el runtime actual de `src/` no importa Prisma.

Tabla de rutas backend:

| Metodo | Ruta | Controlador | Servicio | Autenticacion |
| ------ | ---- | ----------- | -------- | ------------- |
| GET | `/api/mesas` | `obtenerMesas` | Supabase directo | No visible |
| GET | `/api/mesas/estado` | `obtenerEstadoMesas` | Supabase directo | No visible |
| GET | `/api/mesas/disponibles` | `obtenerMesasDisponibles` | Supabase directo | No visible |
| POST | `/api/mesas` | `crearMesa` | Supabase directo | No visible |
| DELETE | `/api/mesas/:id` | `eliminarMesa` | Supabase directo | No visible |
| GET | `/api/reservas` | `obtenerReservas` | Supabase directo | No visible |
| GET | `/api/reservas/:id` | `obtenerReservaPorId` | Supabase directo | No visible |
| POST | `/api/reservas` | `crearReserva` | Supabase directo | No visible |
| PATCH | `/api/reservas/:id/cancelar` | `cancelarReserva` | Supabase directo | No visible |
| GET | `/api/productos` | `obtenerProductos` | Supabase directo | No visible |
| GET | `/api/productos/:id` | `obtenerProductoPorId` | Supabase directo | No visible |
| POST | `/api/productos` | `crearProducto` | Supabase directo | No visible |
| PUT | `/api/productos/:id` | `actualizarProducto` | Supabase directo | No visible |
| DELETE | `/api/productos/:id` | `eliminarProducto` | Supabase directo | No visible |
| PATCH | `/api/productos/:id/disponibilidad` | `cambiarDisponibilidadProducto` | Supabase directo | No visible |
| GET | `/api/pedidos` | `obtenerPedidos` | Supabase directo | No visible |
| GET | `/api/pedidos/:id` | `obtenerPedidoPorId` | Supabase directo | No visible |
| POST | `/api/pedidos` | `abrirPedido` | Supabase directo | No visible |
| POST | `/api/pedidos/:id/productos` | `agregarProductoAlPedido` | Supabase directo | No visible |
| PATCH | `/api/pedidos/:id/cerrar` | `cerrarPedido` | Supabase directo | No visible |
| PATCH | `/api/pedidos/:id/cancelar` | `cancelarPedido` | Supabase directo | No visible |
| PATCH | `/api/pedidos/:id/estado` | `actualizarEstado` | Supabase directo | No visible |
| DELETE | `/api/pedidos/:id` | `eliminarPedido` | Supabase directo | No visible |
| GET | `/api/facturas/arca/verificar` | `verificarARCAController` | ARCA simulado | No visible |
| GET | `/api/facturas/pedidos/listos` | `obtenerPedidosListosParaCobrar` | Supabase directo | No visible |
| POST | `/api/facturas/pedido/:pedidoId/cobrar` | `cobrarPedido` | `arca.service`, `cuentaCorriente.service` | Solo valida rol si `metodoPago=cuenta_corriente` |
| POST | `/api/facturas/:pedidoId/cobrar` | `cobrarPedido` | `arca.service`, `cuentaCorriente.service` | Solo valida rol si `metodoPago=cuenta_corriente` |
| POST | `/api/facturas/pago/:pagoId/confirmar-efectivo` | `confirmarPagoEfectivo` | `arca.service` | No visible |
| GET | `/api/facturas/exportar` | `exportarFacturas` | `excel.service` | `admin` o `cajero` por header |
| GET | `/api/facturas/cuentas-corrientes` | `listarCuentasCorrientes` | `cuentaCorriente.service` | `admin` o `cajero` por header |
| GET | `/api/facturas/cuentas-corrientes/:clienteId` | `obtenerCuentaCorriente` | `cuentaCorriente.service` | `admin` o `cajero` por header |
| GET | `/api/facturas/cuentas-corrientes/:clienteId/exportar` | `exportarCuentaCorriente` | `cuentaCorriente.service`, `excel.service` | `admin` o `cajero` por header |
| POST | `/api/facturas/cuentas-corrientes/:clienteId/pagos` | `registrarPagoCliente` | `cuentaCorriente.service` | `admin` o `cajero` por header |
| POST | `/api/facturas/cuentas-corrientes/:clienteId/ajustes` | `registrarAjusteCliente` | `cuentaCorriente.service` | `admin` o `cajero` por header |
| POST | `/api/facturas/cuentas-corrientes/movimientos/:movimientoId/revertir` | `revertirMovimientoCliente` | `cuentaCorriente.service` | `admin` o `cajero` por header |
| GET | `/api/facturas` | `obtenerFacturas` | Supabase directo | No visible |
| GET | `/api/facturas/:id` | `obtenerFacturaPorId` | Supabase directo | No visible |
| GET | `/api/usuarios` | `obtenerUsuarios` | Supabase directo | No visible |
| GET | `/api/categorias` | `obtenerCategorias` | Supabase directo | No visible |
| POST | `/api/categorias` | `crearCategoria` | Supabase directo | No visible |
| PUT | `/api/categorias/:id` | `actualizarCategoria` | Supabase directo | No visible |
| DELETE | `/api/categorias/:id` | `eliminarCategoria` | Supabase directo | No visible |

## 4. Frontend

Next.js App Router:

- Layout global: `noctua/app/layout.tsx`.
- Providers: `noctua/app/providers.tsx`, incluye React Query y aplicacion de tema superadmin.
- Middleware: `noctua/middleware.ts`, protege `/dashboard/:path*` por cookie `noctua-auth` y `/superadm/:path*` por cookie `superadm_session`.
- Dashboard layout: `noctua/app/dashboard/layout.tsx`, incluye `Sidebar`, `Navbar` y alerta global de pedidos listos.
- Superadmin layout: `noctua/app/superadm/layout.tsx`, incluye sidebar y header propios.

Menu lateral:

- `noctua/components/layout/Sidebar.tsx`
- Lee `usuario` desde `useAuthStore`.
- Filtra secciones con `obtenerSeccionesPorRol(usuario?.rol)` desde `noctua/config/roles.ts`.

Servicios HTTP:

- `noctua/hooks/lib/api/client.ts`: wrapper REST para backend Express.
- `noctua/hooks/lib/supabaseClient.ts`: cliente Supabase anon/public.
- Servicios por dominio en `noctua/services/`.
- Hooks con React Query en `noctua/hooks/`.

Stores:

- `authStore`: sesion local operativa.
- `mesasStore`, `pedidosStore`, `stockStore`, `deliveryStore`, `notificationsStore`, `superadmStore`.

Tabla de pantallas:

| Ruta de pantalla | Pagina | Componentes | Servicio | Store |
| ---------------- | ------ | ----------- | -------- | ----- |
| `/login` | `app/login/page.tsx` | UI login | `authStore.login` | `authStore` |
| `/dashboard` | `app/dashboard/page.tsx` | Dashboard cards | `analyticsService` / hooks | `authStore` |
| `/dashboard/analytics` | `app/dashboard/analytics/page.tsx` | `KPICard`, charts | `analyticsService` | `authStore` |
| `/dashboard/mesas` | `app/dashboard/mesas/page.tsx` | Mesa*, floor plan, merge, alertas | `mesasApi`, `mesaMergeService` | `mesasStore` |
| `/dashboard/pedido` | `app/dashboard/pedido/page.tsx` | pedidos, selector productos | `pedidosApi` | `pedidosStore` |
| `/dashboard/cocina` | `app/dashboard/cocina/page.tsx` | columnas cocina | `cocinaService` | React Query |
| `/dashboard/facturas` | `app/dashboard/facturas/page.tsx` | `EstadoArca`, `PedidoSelector`, `FormularioCobro`, `TablaFacturas` | `facturasService` | `authStore` |
| `/dashboard/facturas/cuentas-corrientes` | `app/dashboard/facturas/cuentas-corrientes/page.tsx` | listado cuentas | `facturasService` | `authStore` |
| `/dashboard/facturas/cuentas-corrientes/[clienteId]` | `app/dashboard/facturas/cuentas-corrientes/[clienteId]/page.tsx` | detalle, pagos, ajustes, export | `facturasService` | `authStore` |
| `/dashboard/historial` | `app/dashboard/historial/page.tsx` | historial pedidos | local/mock | local state |
| `/dashboard/stock` | `app/dashboard/stock/page.tsx` | stock components | `stockService`, `productosApi` | `stockStore` |
| `/dashboard/platos` | `app/dashboard/platos/page.tsx` | `DishAdminCard`, `DishFormPanel`, `DishSuggesterModal`, `ConfirmDeleteModal` | `dishesService` / mock data | `dishesStore`, `stockStore` |
| `/dashboard/promociones` | `app/dashboard/promociones/page.tsx` | `PromotionCard`, `PromotionFormModal`, `DishSelector`, `ConfirmDeleteModal` | `promotionsService` / localStorage | `promotionsStore` |
| `/dashboard/reservas` | `app/dashboard/reservas/page.tsx` | formulario/listado reservas | `reservasApi` | local state |
| `/dashboard/administracion` | `app/dashboard/administracion/page.tsx` | usuarios table/modal | `usuariosService`, `authService` | local state |
| `/dashboard/delivery` | `app/dashboard/delivery/page.tsx` | `PlatformCard` | `deliveryService` | `deliveryStore` |
| `/dashboard/delivery/[platform]` | `app/dashboard/delivery/[platform]/page.tsx` | `OrderCard` | `useDeliveryOrders` | `deliveryStore` |
| `/dashboard/soporte` | `app/dashboard/soporte/page.tsx` | tickets soporte | `soporteService`, API soporte | `authStore` |
| `/superadm` | `app/superadm/page.tsx` | panel resumen | `superadmStore` | `superadmStore` |
| `/superadm/mesas` | `app/superadm/mesas/page.tsx` | config mesas | `superadmStore` | `superadmStore` |
| `/superadm/cocina` | `app/superadm/cocina/page.tsx` | config cocina | `superadmStore` | `superadmStore` |
| `/superadm/stock` | `app/superadm/stock/page.tsx` | config stock | `stockStore`, `superadmStore` | stores |
| `/superadm/delivery` | `app/superadm/delivery/page.tsx` | config delivery | `superadmStore` | `superadmStore` |
| `/superadm/diseno` | `app/superadm/diseno/page.tsx` | tema/diseno | `superadmStore` | `superadmStore` |
| `/superadm/configuracion` | `app/superadm/configuracion/page.tsx` | settings | `superadmStore` | `superadmStore` |
| `/superadm/login` | `app/superadm/login/page.tsx` | PIN login | server action `verifyPin` | cookie |

## 5. Roles

Valores reales encontrados:

- En `noctua/config/roles.ts`: `admin`, `cajero`, `cocina`, `mozo`, `stock`, `delivery`.
- En `noctua/types/usuario.ts`: `admin`, `mozo`, `cocina`, `cajero`.
- En UI de administracion: labels `Administrador`, `Mozo`, `Cocinero`, `Cajero`.
- En backend facturacion: roles autorizados `admin` y `cajero`.

Administrador:

- Valor operativo: `admin`.
- Se obtiene desde `useAuthStore.usuario.rol` en frontend o desde headers `X-Noctua-Role` / `X-User-Role` en backend.
- Se guarda en Zustand persistido bajo key `noctua-auth` y tambien en cookie `noctua-auth` solo con estado autenticado.
- Filtra menu con `SECCIONES_POR_ROL.admin`.
- Protecciones puntuales: analytics restringe UI si rol no es `admin`; cuenta corriente permite `admin` o `cajero`; backend factura valida `admin` o `cajero`.

Desarrollador:

- No existe rol `desarrollador` en referencias reales.
- El superadmin no usa rol de usuario: usa cookie `superadm_session` creada por `verifyPin`.

Otros roles:

- `cajero`: facturas, historial, mesas, pedidos, soporte; autorizado para cuenta corriente/export.
- `cocina`: cocina y soporte.
- `mozo`: mesas, pedidos, cocina y soporte.
- `stock`: stock, platos, promociones y soporte.
- `delivery`: delivery y soporte.

## 6. Base de datos

### Prisma

Archivo: `backend-reservas/prisma/schema.prisma`

Modelos:

- `Mesa`: reservas y pedidos.
- `Reserva`: pertenece a `Mesa`.
- `Producto`: detalles de pedido.
- `Pedido`: pertenece a `Mesa`, tiene detalles y una factura.
- `DetallePedido`: relaciona `Pedido` y `Producto`.
- `Factura`: relacion 1:1 con `Pedido`.

Modulos que lo utilizan:

- `backend-reservas/prisma/seed.js` importa `PrismaClient`.
- No se detecto uso de Prisma en `backend-reservas/src/`.

### Supabase

Tablas visibles en SQL o consultas:

- `usuarios`
- `profiles`
- `mesas`
- `categorias`
- `productos`
- `pedidos`
- `pedido_items`
- `facturas`
- `pagos`
- `reservas`
- `movimientos_stock`
- `clientes`
- `cuentas_corrientes`
- `pagos_cuenta_corriente`
- `movimientos_cuenta_corriente`
- `tickets_soporte`

Clientes Supabase:

- Backend Admin: `backend-reservas/src/config/supabaseAdmin.js`.
- Frontend anon: `noctua/hooks/lib/supabaseClient.ts`.
- API routes con service role: `noctua/app/api/admin/usuarios/route.ts`, `noctua/app/api/admin/analytics/route.ts`, `noctua/app/api/soporte/[id]/route.ts`.

RLS/politicas visibles:

- No se encontraron sentencias `CREATE POLICY` ni `ENABLE ROW LEVEL SECURITY` en los SQL revisados.
- Comentarios indican que RLS se espera para soporte y que analytics usa service role para evitar restricciones del cliente anonimo.

Scripts SQL:

- `noctua/base-de-datos.sql`: esquema de contexto para tablas principales.
- `backend-reservas/sql/facturacion-cuenta-corriente.sql`: cambios manuales para clientes, cuenta corriente y movimientos.

## 7. Integraciones

- ARCA: `backend-reservas/src/services/arca.service.js` simula CAE, numero de comprobante y vencimiento; `facturas.controller.js` usa `ARCA_MODO`, `ARCA_CUIT`, `ARCA_PUNTO_VENTA` por nombre.
- Supabase: backend admin y cliente frontend. Varias rutas Next API tambien usan service role por env.
- Excel: `backend-reservas/src/services/excel.service.js` usa ExcelJS para facturas y cuenta corriente.
- Autenticacion: login mock operativo con Zustand; Supabase Auth Admin para crear/actualizar/eliminar usuarios desde API route; superadmin por PIN y cookie.
- Almacenamiento: no se confirmo uso de buckets/storage.
- APIs externas: Resend para emails de soporte; Glovo/Rappi/PedidosYa/Uber Eats con adapters, muchos marcados TODO/mock.
- Export dashboard: `noctua/utils/exportDashboard.ts` usa `html2canvas` y `jspdf`.

## 8. Problemas detectados

### Criticos

- Posibles claves reales versionadas en archivos de prueba. Archivos: `noctua/test-pedidos-enum.mjs`, `noctua/test-estados.mjs`, `noctua/test-select-rls.mjs`. El valor se omite aqui como `[OCULTO]`. Deben rotarse en Supabase si fueron reales.
- Login operativo de `authStore` contiene credenciales mock hardcodeadas en codigo. No se copian aqui por seguridad.
- `app/superadm/login/actions.ts` imprime en consola el PIN recibido y esperado. Aunque no se copia el valor, la conducta expone datos sensibles en logs.

### Importantes

- Error de tipo confirmado: `noctua/store/deliveryStore.ts` define `viewMode` y `setViewMode` como `'kanban' | 'list'`, pero `noctua/app/dashboard/delivery/[platform]/page.tsx` usa `'grid'`.
- Backend Express no tiene middleware global de autenticacion. Muchas rutas CRUD quedan sin validacion visible.
- Prisma parece desalineado con Supabase: schema SQLite con modelos antiguos, mientras los controladores usan tablas Supabase con UUID y nombres snake_case.
- `backend-reservas/prisma/seed.js` importa `@prisma/client`, pero `backend-reservas/package.json` no declara `prisma` ni `@prisma/client`.
- `backend-reservas/sql/facturacion-cuenta-corriente.sql` agrega `cuenta_corriente` al CHECK de `pagos.metodo_pago`, pero `noctua/base-de-datos.sql` aun lista solo `debito`, `credito`, `billetera_virtual`, `efectivo`.
- `backend-reservas/src/controllers/facturas.controller.js` inserta/consulta columnas como `cliente_id` y `saldo_pendiente`; en `noctua/base-de-datos.sql` esas columnas no figuran hasta aplicar el SQL manual.
- `obtenerFacturas` en `facturas.controller.js` no selecciona `clientes(*)`, pero `mapFactura` espera `factura.clientes`.
- ARCA esta simulado, no hay integracion SOAP real aunque `soap` esta instalado.
- Scripts que modifican datos: `backend-reservas/fix2.mjs`, `backend-reservas/merge-categorias.mjs`, `noctua/fix-categorias.mjs`, tests que insertan/borran datos.

### Menores

- Archivo backup versionado: `noctua/components/mesas/MesaCard.bak.tsx`.
- Modulos nuevos de platos/promociones guardan datos en Zustand/localStorage o mock data; no se confirmo persistencia Supabase para esos dominios.
- APIs duplicadas o superpuestas: `noctua/hooks/lib/pedidosApi.ts` y `noctua/hooks/lib/api/pedidosApi.ts`.
- Comentarios TODO indican servicios todavia mock o pendientes: mesas, pedidos, stock, delivery adapters.
- `backend-reservas` declara `soap` sin uso directo.
- `package.json` raiz contiene dependencias sin scripts ni uso claro.

## 9. Estado de Git

Rama actual:

```text
cambios-moli
```

`git status --short --branch` al actualizar esta documentacion:

```text
## cambios-moli...origin/cambios-moli [ahead 4]
 M CONTEXTO_FACTURACION_NOCTUA.md
 M ESTRUCTURA_NOCTUA.txt
 M INFORME_ARQUITECTURA_NOCTUA.md
```

Ultimos 10 commits:

```text
e31409b (HEAD -> cambios-moli) merge: integrar cambios de origin/cambios-moli
b4c016c (backup-antes-de-cambios-moli-20260702-2) backup: documentacion local antes de cambios-moli
77ce43c (origin/cambios-moli) Seccion Platos y Promociones creadas. Seccion Pedidos avanzada
140aa58 merge: integrar cambios de origin/cambios-moli
f06c939 backup: estado antes de cambios-moli
9106108 stock-avanzado
56f332e mesas
27e92b4 Sincronizar estado de mesa desde cocina + notificacion pedido listo
b9cafaa mejora en facturas
29778d9 Super-Admin Panel agregado
```

Archivos modificados:

- `CONTEXTO_FACTURACION_NOCTUA.md`
- `ESTRUCTURA_NOCTUA.txt`
- `INFORME_ARQUITECTURA_NOCTUA.md`

Archivos sin seguimiento:

- Ninguno confirmado al momento del relevamiento.

## 10. Informacion no confirmada

- Version exacta de Node no esta declarada en `engines`, `.nvmrc` ni archivos equivalentes revisados.
- No se verifico una base Supabase remota ni estado real de RLS; solo se reviso el repositorio.
- No se validaron endpoints contra servicios externos.
- No se ejecuto lint/build/tests en esta tarea de documentacion.
