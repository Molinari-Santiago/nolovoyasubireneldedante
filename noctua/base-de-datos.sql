-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL,
  username character varying NOT NULL UNIQUE,
  rol USER-DEFINED NOT NULL DEFAULT 'mozo'::user_role,
  activo boolean DEFAULT true,
  creado_en timestamp without time zone DEFAULT now(),
  auth_user_id uuid UNIQUE,
  CONSTRAINT usuarios_pkey PRIMARY KEY (id),
  CONSTRAINT usuarios_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.mesas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  numero integer NOT NULL UNIQUE,
  capacidad integer DEFAULT 4,
  pos_x numeric DEFAULT 0,
  pos_y numeric DEFAULT 0,
  estado USER-DEFINED DEFAULT 'libre'::mesa_estado,
  creada_en timestamp without time zone DEFAULT now(),
  piso text,
  zona text,
  forma text,
  disponible boolean DEFAULT true,
  CONSTRAINT mesas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categorias (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre character varying NOT NULL,
  color character varying,
  CONSTRAINT categorias_pkey PRIMARY KEY (id)
);
CREATE TABLE public.productos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  categoria_id uuid,
  nombre character varying NOT NULL,
  descripcion text,
  precio numeric NOT NULL,
  stock_actual numeric DEFAULT 0,
  disponible boolean DEFAULT true,
  creado_en timestamp without time zone DEFAULT now(),
  stock integer,
  CONSTRAINT productos_pkey PRIMARY KEY (id),
  CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id)
);
CREATE TABLE public.pedidos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mesa_id uuid,
  usuario_id uuid,
  estado USER-DEFINED DEFAULT 'pendiente'::pedido_estado,
  subtotal numeric DEFAULT 0,
  impuestos numeric DEFAULT 0,
  total numeric DEFAULT 0,
  abierto_en timestamp without time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pedidos_pkey PRIMARY KEY (id),
  CONSTRAINT pedidos_mesa_id_fkey FOREIGN KEY (mesa_id) REFERENCES public.mesas(id),
  CONSTRAINT pedidos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.pedido_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pedido_id uuid,
  producto_id uuid,
  cantidad numeric NOT NULL DEFAULT 1,
  precio_unitario numeric NOT NULL,
  subtotal numeric NOT NULL,
  estado USER-DEFINED DEFAULT 'pendiente'::pedido_estado,
  notas text,
  CONSTRAINT pedido_items_pkey PRIMARY KEY (id),
  CONSTRAINT pedido_items_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id),
  CONSTRAINT pedido_items_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id)
);
CREATE TABLE public.facturas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pedido_id uuid,
  estado USER-DEFINED DEFAULT 'pendiente'::factura_estado,
  cae character varying,
  qr_fiscal text,
  total numeric,
  creada_en timestamp without time zone DEFAULT now(),
  pago_id uuid,
  metodo_pago text,
  descuento numeric DEFAULT 0,
  tipo_cbte integer,
  punto_venta integer,
  numero_cbte bigint,
  vencimiento_cae text,
  qr text,
  error text,
  mesa_id uuid,
  numero_comprobante text,
  subtotal numeric DEFAULT 0,
  impuestos numeric DEFAULT 0,
  arca_estado text,
  arca_error text,
  creado_en timestamp with time zone DEFAULT now(),
  tipo_comprobante integer DEFAULT 6,
  CONSTRAINT facturas_pkey PRIMARY KEY (id),
  CONSTRAINT facturas_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id),
  CONSTRAINT facturas_pago_id_fkey FOREIGN KEY (pago_id) REFERENCES public.pagos(id)
);
CREATE TABLE public.reservas (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  nombre_cliente character varying NOT NULL,
  telefono character varying,
  cantidad_personas integer NOT NULL,
  fecha date NOT NULL,
  hora time without time zone NOT NULL,
  creada_en timestamp without time zone DEFAULT now(),
  mesa_id uuid,
  email_cliente text,
  codigo_reserva text,
  mesas_ids jsonb,
  user_id uuid,
  email text,
  estado text DEFAULT 'activa'::text CHECK (estado = ANY (ARRAY['activa'::text, 'cancelada'::text, 'completada'::text])),
  cancelada_en timestamp with time zone,
  CONSTRAINT reservas_pkey PRIMARY KEY (id),
  CONSTRAINT reservas_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT reservas_mesa_id_fkey FOREIGN KEY (mesa_id) REFERENCES public.mesas(id)
);
CREATE TABLE public.movimientos_stock (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  producto_id uuid,
  cantidad numeric NOT NULL,
  motivo text,
  creado_en timestamp without time zone DEFAULT now(),
  tipo text,
  stock_anterior numeric,
  stock_nuevo numeric,
  pedido_id uuid,
  CONSTRAINT movimientos_stock_pkey PRIMARY KEY (id),
  CONSTRAINT movimientos_stock_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id),
  CONSTRAINT movimientos_stock_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  nombre text,
  telefono text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.pagos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL,
  mesa_id uuid,
  metodo_pago text NOT NULL CHECK (metodo_pago = ANY (ARRAY['debito'::text, 'credito'::text, 'billetera_virtual'::text, 'efectivo'::text])),
  monto numeric NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente'::text CHECK (estado = ANY (ARRAY['pendiente'::text, 'pagado'::text, 'cancelado'::text, 'expirado'::text])),
  referencia_pago text,
  proveedor text,
  recibido_por text,
  vuelto numeric,
  creado_en timestamp with time zone DEFAULT now(),
  actualizado_en timestamp with time zone DEFAULT now(),
  expira_en timestamp with time zone,
  monto_recibido numeric,
  temporal boolean DEFAULT false,
  arca_estado text DEFAULT 'pendiente'::text,
  arca_tipo_cbte integer,
  arca_punto_venta integer,
  arca_numero_cbte bigint,
  arca_cae text,
  arca_vencimiento_cae text,
  arca_qr text,
  arca_error text,
  tipo_tarjeta text,
  marca_tarjeta text,
  banco_tarjeta text,
  proveedor_billetera text,
  confirmado_en timestamp with time zone,
  tipo_comprobante integer DEFAULT 6,
  CONSTRAINT pagos_pkey PRIMARY KEY (id)
);