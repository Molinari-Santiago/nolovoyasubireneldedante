import type { StockCategory, Ingredient } from '@/types/stock';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[áàâäã]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôöõ]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildInitialStock(): StockCategory[] {
  const now = new Date();

  const categories: StockCategory[] = [
    {
      id: 'cafeteria-bebidas-calientes',
      name: 'Cafetería y desayunos — Bebidas calientes',
      ingredients: [
        { id: 'cafe-en-grano-cafeteria-bebidas-calientes', name: 'Café en grano', category: 'Cafetería y desayunos — Bebidas calientes', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'cafe-molido-cafeteria-bebidas-calientes', name: 'Café molido', category: 'Cafetería y desayunos — Bebidas calientes', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'leche-entera-cafeteria-bebidas-calientes', name: 'Leche entera', category: 'Cafetería y desayunos — Bebidas calientes', stock: 20, unit: 'litros', minStock: 3, lastUpdated: now },
        { id: 'leche-descremada-cafeteria-bebidas-calientes', name: 'Leche descremada', category: 'Cafetería y desayunos — Bebidas calientes', stock: 20, unit: 'litros', minStock: 3, lastUpdated: now },
        { id: 'leche-vegetal-cafeteria-bebidas-calientes', name: 'Leche vegetal', category: 'Cafetería y desayunos — Bebidas calientes', stock: 20, unit: 'litros', minStock: 5, lastUpdated: now },
        { id: 'te-negro-cafeteria-bebidas-calientes', name: 'Té negro', category: 'Cafetería y desayunos — Bebidas calientes', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'te-verde-cafeteria-bebidas-calientes', name: 'Té verde', category: 'Cafetería y desayunos — Bebidas calientes', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'mate-cocido-cafeteria-bebidas-calientes', name: 'Mate cocido', category: 'Cafetería y desayunos — Bebidas calientes', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'chocolate-en-polvo-cafeteria-bebidas-calientes', name: 'Chocolate en polvo', category: 'Cafetería y desayunos — Bebidas calientes', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'azucar-cafeteria-bebidas-calientes', name: 'Azúcar', category: 'Cafetería y desayunos — Bebidas calientes', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'edulcorante-cafeteria-bebidas-calientes', name: 'Edulcorante', category: 'Cafetería y desayunos — Bebidas calientes', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'canela-cafeteria-bebidas-calientes', name: 'Canela', category: 'Cafetería y desayunos — Bebidas calientes', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'cafeteria-panaderia',
      name: 'Cafetería y desayunos — Panadería y acompañamientos',
      ingredients: [
        { id: 'pan-lactal-cafeteria-panaderia', name: 'Pan lactal', category: 'Cafetería y desayunos — Panadería y acompañamientos', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'pan-frances-cafeteria-panaderia', name: 'Pan francés', category: 'Cafetería y desayunos — Panadería y acompañamientos', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'medialunas-cafeteria-panaderia', name: 'Medialunas', category: 'Cafetería y desayunos — Panadería y acompañamientos', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'facturas-surtidas-cafeteria-panaderia', name: 'Facturas surtidas', category: 'Cafetería y desayunos — Panadería y acompañamientos', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'manteca-cafeteria-panaderia', name: 'Manteca', category: 'Cafetería y desayunos — Panadería y acompañamientos', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'mermeladas-cafeteria-panaderia', name: 'Mermeladas', category: 'Cafetería y desayunos — Panadería y acompañamientos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'dulce-de-leche-cafeteria-panaderia', name: 'Dulce de leche', category: 'Cafetería y desayunos — Panadería y acompañamientos', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'queso-crema-cafeteria-panaderia', name: 'Queso crema', category: 'Cafetería y desayunos — Panadería y acompañamientos', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'miel-cafeteria-panaderia', name: 'Miel', category: 'Cafetería y desayunos — Panadería y acompañamientos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'bebidas-gaseosas',
      name: 'Bebidas — Gaseosas',
      ingredients: [
        { id: 'cola-bebidas-gaseosas', name: 'Cola', category: 'Bebidas — Gaseosas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'lima-limon-bebidas-gaseosas', name: 'Lima-limón', category: 'Bebidas — Gaseosas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'naranja-bebidas-gaseosas', name: 'Naranja', category: 'Bebidas — Gaseosas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'pomelo-bebidas-gaseosas', name: 'Pomelo', category: 'Bebidas — Gaseosas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'tonica-bebidas-gaseosas', name: 'Tónica', category: 'Bebidas — Gaseosas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'bebidas-jugos',
      name: 'Bebidas — Jugos',
      ingredients: [
        { id: 'naranja-bebidas-jugos', name: 'Naranja', category: 'Bebidas — Jugos', stock: 20, unit: 'litros', minStock: 5, lastUpdated: now },
        { id: 'manzana-bebidas-jugos', name: 'Manzana', category: 'Bebidas — Jugos', stock: 20, unit: 'litros', minStock: 5, lastUpdated: now },
        { id: 'durazno-bebidas-jugos', name: 'Durazno', category: 'Bebidas — Jugos', stock: 20, unit: 'litros', minStock: 5, lastUpdated: now },
        { id: 'multifruta-bebidas-jugos', name: 'Multifruta', category: 'Bebidas — Jugos', stock: 20, unit: 'litros', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'bebidas-otras',
      name: 'Bebidas — Otras bebidas',
      ingredients: [
        { id: 'agua-mineral-con-gas-bebidas-otras', name: 'Agua mineral con gas', category: 'Bebidas — Otras bebidas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'agua-mineral-sin-gas-bebidas-otras', name: 'Agua mineral sin gas', category: 'Bebidas — Otras bebidas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'soda-bebidas-otras', name: 'Soda', category: 'Bebidas — Otras bebidas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'energizantes-bebidas-otras', name: 'Energizantes', category: 'Bebidas — Otras bebidas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'cervezas-bebidas-otras', name: 'Cervezas', category: 'Bebidas — Otras bebidas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'vinos-bebidas-otras', name: 'Vinos', category: 'Bebidas — Otras bebidas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'fernet-bebidas-otras', name: 'Fernet', category: 'Bebidas — Otras bebidas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'vodka-bebidas-otras', name: 'Vodka', category: 'Bebidas — Otras bebidas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'gin-bebidas-otras', name: 'Gin', category: 'Bebidas — Otras bebidas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'whisky-bebidas-otras', name: 'Whisky', category: 'Bebidas — Otras bebidas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'ron-bebidas-otras', name: 'Ron', category: 'Bebidas — Otras bebidas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'bebidas-para-tragos',
      name: 'Bebidas — Para tragos',
      ingredients: [
        { id: 'limones-bebidas-para-tragos', name: 'Limones', category: 'Bebidas — Para tragos', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'naranjas-bebidas-para-tragos', name: 'Naranjas', category: 'Bebidas — Para tragos', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'menta-bebidas-para-tragos', name: 'Menta', category: 'Bebidas — Para tragos', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'jarabe-de-azucar-bebidas-para-tragos', name: 'Jarabe de azúcar', category: 'Bebidas — Para tragos', stock: 20, unit: 'litros', minStock: 5, lastUpdated: now },
        { id: 'hielo-bebidas-para-tragos', name: 'Hielo', category: 'Bebidas — Para tragos', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'carnes-vacuna',
      name: 'Carnes y proteínas — Vacuna',
      ingredients: [
        { id: 'carne-picada-carnes-vacuna', name: 'Carne picada', category: 'Carnes y proteínas — Vacuna', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'nalga-carnes-vacuna', name: 'Nalga', category: 'Carnes y proteínas — Vacuna', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'cuadrada-carnes-vacuna', name: 'Cuadrada', category: 'Carnes y proteínas — Vacuna', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'bife-de-chorizo-carnes-vacuna', name: 'Bife de chorizo', category: 'Carnes y proteínas — Vacuna', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'costilla-carnes-vacuna', name: 'Costilla', category: 'Carnes y proteínas — Vacuna', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
      ]
    },
    {
      id: 'carnes-pollo',
      name: 'Carnes y proteínas — Pollo',
      ingredients: [
        { id: 'pechuga-carnes-pollo', name: 'Pechuga', category: 'Carnes y proteínas — Pollo', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'muslo-carnes-pollo', name: 'Muslo', category: 'Carnes y proteínas — Pollo', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'alitas-carnes-pollo', name: 'Alitas', category: 'Carnes y proteínas — Pollo', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
      ]
    },
    {
      id: 'carnes-cerdo',
      name: 'Carnes y proteínas — Cerdo',
      ingredients: [
        { id: 'bondiola-carnes-cerdo', name: 'Bondiola', category: 'Carnes y proteínas — Cerdo', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'costeletas-carnes-cerdo', name: 'Costeletas', category: 'Carnes y proteínas — Cerdo', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'panceta-carnes-cerdo', name: 'Panceta', category: 'Carnes y proteínas — Cerdo', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
      ]
    },
    {
      id: 'carnes-otros',
      name: 'Carnes y proteínas — Otros',
      ingredients: [
        { id: 'huevos-carnes-otros', name: 'Huevos', category: 'Carnes y proteínas — Otros', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'atun-carnes-otros', name: 'Atún', category: 'Carnes y proteínas — Otros', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'jamon-cocido-carnes-otros', name: 'Jamón cocido', category: 'Carnes y proteínas — Otros', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'jamon-crudo-carnes-otros', name: 'Jamón crudo', category: 'Carnes y proteínas — Otros', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'salchichas-carnes-otros', name: 'Salchichas', category: 'Carnes y proteínas — Otros', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'verduras',
      name: 'Verduras',
      ingredients: [
        { id: 'papa-verduras', name: 'Papa', category: 'Verduras', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'batata-verduras', name: 'Batata', category: 'Verduras', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'cebolla-verduras', name: 'Cebolla', category: 'Verduras', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'cebolla-de-verdeo-verduras', name: 'Cebolla de verdeo', category: 'Verduras', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'ajo-verduras', name: 'Ajo', category: 'Verduras', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'lechuga-verduras', name: 'Lechuga', category: 'Verduras', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'tomate-verduras', name: 'Tomate', category: 'Verduras', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'zanahoria-verduras', name: 'Zanahoria', category: 'Verduras', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'morron-rojo-verduras', name: 'Morrón rojo', category: 'Verduras', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'morron-verde-verduras', name: 'Morrón verde', category: 'Verduras', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'pepino-verduras', name: 'Pepino', category: 'Verduras', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'berenjena-verduras', name: 'Berenjena', category: 'Verduras', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'zapallito-verduras', name: 'Zapallito', category: 'Verduras', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'brocoli-verduras', name: 'Brócoli', category: 'Verduras', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'champinones-verduras', name: 'Champiñones', category: 'Verduras', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'perejil-verduras', name: 'Perejil', category: 'Verduras', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'cilantro-verduras', name: 'Cilantro', category: 'Verduras', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'rucula-verduras', name: 'Rúcula', category: 'Verduras', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
      ]
    },
    {
      id: 'frutas',
      name: 'Frutas',
      ingredients: [
        { id: 'limon-frutas', name: 'Limón', category: 'Frutas', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'naranja-frutas', name: 'Naranja', category: 'Frutas', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'manzana-frutas', name: 'Manzana', category: 'Frutas', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'banana-frutas', name: 'Banana', category: 'Frutas', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'pera-frutas', name: 'Pera', category: 'Frutas', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'frutilla-frutas', name: 'Frutilla', category: 'Frutas', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'kiwi-frutas', name: 'Kiwi', category: 'Frutas', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
      ]
    },
    {
      id: 'lacteos',
      name: 'Lácteos',
      ingredients: [
        { id: 'leche-lacteos', name: 'Leche', category: 'Lácteos', stock: 20, unit: 'litros', minStock: 3, lastUpdated: now },
        { id: 'crema-de-leche-lacteos', name: 'Crema de leche', category: 'Lácteos', stock: 20, unit: 'litros', minStock: 3, lastUpdated: now },
        { id: 'manteca-lacteos', name: 'Manteca', category: 'Lácteos', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'queso-mozzarella-lacteos', name: 'Queso mozzarella', category: 'Lácteos', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'queso-cremoso-lacteos', name: 'Queso cremoso', category: 'Lácteos', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'queso-cheddar-lacteos', name: 'Queso cheddar', category: 'Lácteos', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'queso-parmesano-lacteos', name: 'Queso parmesano', category: 'Lácteos', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'queso-azul-lacteos', name: 'Queso azul', category: 'Lácteos', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'yogur-natural-lacteos', name: 'Yogur natural', category: 'Lácteos', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
      ]
    },
    {
      id: 'panificados',
      name: 'Panificados',
      ingredients: [
        { id: 'pan-de-hamburguesa-panificados', name: 'Pan de hamburguesa', category: 'Panificados', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'pan-de-pancho-panificados', name: 'Pan de pancho', category: 'Panificados', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'pan-para-tostados-panificados', name: 'Pan para tostados', category: 'Panificados', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'tortillas-para-wraps-panificados', name: 'Tortillas para wraps', category: 'Panificados', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'tapas-para-empanadas-panificados', name: 'Tapas para empanadas', category: 'Panificados', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'tapas-para-tartas-panificados', name: 'Tapas para tartas', category: 'Panificados', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'pan-rallado-panificados', name: 'Pan rallado', category: 'Panificados', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'pastas-y-cereales',
      name: 'Pastas y cereales',
      ingredients: [
        { id: 'fideos-secos-pastas-y-cereales', name: 'Fideos secos', category: 'Pastas y cereales', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'spaghetti-pastas-y-cereales', name: 'Spaghetti', category: 'Pastas y cereales', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'penne-pastas-y-cereales', name: 'Penne', category: 'Pastas y cereales', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'arroz-pastas-y-cereales', name: 'Arroz', category: 'Pastas y cereales', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'arroz-para-risotto-pastas-y-cereales', name: 'Arroz para risotto', category: 'Pastas y cereales', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'polenta-pastas-y-cereales', name: 'Polenta', category: 'Pastas y cereales', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'avena-pastas-y-cereales', name: 'Avena', category: 'Pastas y cereales', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'harina-000-pastas-y-cereales', name: 'Harina 000', category: 'Pastas y cereales', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'harina-leudante-pastas-y-cereales', name: 'Harina leudante', category: 'Pastas y cereales', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'fecula-de-maiz-pastas-y-cereales', name: 'Fécula de maíz', category: 'Pastas y cereales', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'comida-rapida-hamburguesas',
      name: 'Comida rápida — Hamburguesas',
      ingredients: [
        { id: 'medallones-de-carne-comida-rapida-hamburguesas', name: 'Medallones de carne', category: 'Comida rápida — Hamburguesas', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'pan-de-hamburguesa-comida-rapida-hamburguesas', name: 'Pan de hamburguesa', category: 'Comida rápida — Hamburguesas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'lechuga-comida-rapida-hamburguesas', name: 'Lechuga', category: 'Comida rápida — Hamburguesas', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'tomate-comida-rapida-hamburguesas', name: 'Tomate', category: 'Comida rápida — Hamburguesas', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'cebolla-comida-rapida-hamburguesas', name: 'Cebolla', category: 'Comida rápida — Hamburguesas', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'cheddar-comida-rapida-hamburguesas', name: 'Cheddar', category: 'Comida rápida — Hamburguesas', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'panceta-comida-rapida-hamburguesas', name: 'Panceta', category: 'Comida rápida — Hamburguesas', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'pepinillos-comida-rapida-hamburguesas', name: 'Pepinillos', category: 'Comida rápida — Hamburguesas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'comida-rapida-panchos',
      name: 'Comida rápida — Panchos',
      ingredients: [
        { id: 'salchichas-comida-rapida-panchos', name: 'Salchichas', category: 'Comida rápida — Panchos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'pan-de-pancho-comida-rapida-panchos', name: 'Pan de pancho', category: 'Comida rápida — Panchos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'mostaza-comida-rapida-panchos', name: 'Mostaza', category: 'Comida rápida — Panchos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'ketchup-comida-rapida-panchos', name: 'Ketchup', category: 'Comida rápida — Panchos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'mayonesa-comida-rapida-panchos', name: 'Mayonesa', category: 'Comida rápida — Panchos', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'comida-rapida-pizzas',
      name: 'Comida rápida — Pizzas',
      ingredients: [
        { id: 'harina-comida-rapida-pizzas', name: 'Harina', category: 'Comida rápida — Pizzas', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'levadura-comida-rapida-pizzas', name: 'Levadura', category: 'Comida rápida — Pizzas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'salsa-de-tomate-comida-rapida-pizzas', name: 'Salsa de tomate', category: 'Comida rápida — Pizzas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'mozzarella-comida-rapida-pizzas', name: 'Mozzarella', category: 'Comida rápida — Pizzas', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'aceitunas-comida-rapida-pizzas', name: 'Aceitunas', category: 'Comida rápida — Pizzas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'oregano-comida-rapida-pizzas', name: 'Orégano', category: 'Comida rápida — Pizzas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'comida-rapida-papas-fritas',
      name: 'Comida rápida — Papas fritas',
      ingredients: [
        { id: 'papas-comida-rapida-papas-fritas', name: 'Papas', category: 'Comida rápida — Papas fritas', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'aceite-comida-rapida-papas-fritas', name: 'Aceite', category: 'Comida rápida — Papas fritas', stock: 20, unit: 'litros', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'minutas-milanesas',
      name: 'Minutas — Milanesas',
      ingredients: [
        { id: 'nalga-minutas-milanesas', name: 'Nalga', category: 'Minutas — Milanesas', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'pechuga-de-pollo-minutas-milanesas', name: 'Pechuga de pollo', category: 'Minutas — Milanesas', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'huevos-minutas-milanesas', name: 'Huevos', category: 'Minutas — Milanesas', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'pan-rallado-minutas-milanesas', name: 'Pan rallado', category: 'Minutas — Milanesas', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'ajo-minutas-milanesas', name: 'Ajo', category: 'Minutas — Milanesas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'perejil-minutas-milanesas', name: 'Perejil', category: 'Minutas — Milanesas', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
      ]
    },
    {
      id: 'minutas-tortillas',
      name: 'Minutas — Tortillas y revueltos',
      ingredients: [
        { id: 'huevos-minutas-tortillas', name: 'Huevos', category: 'Minutas — Tortillas y revueltos', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'papa-minutas-tortillas', name: 'Papa', category: 'Minutas — Tortillas y revueltos', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'cebolla-minutas-tortillas', name: 'Cebolla', category: 'Minutas — Tortillas y revueltos', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
      ]
    },
    {
      id: 'minutas-omelettes',
      name: 'Minutas — Omelettes',
      ingredients: [
        { id: 'huevos-minutas-omelettes', name: 'Huevos', category: 'Minutas — Omelettes', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'queso-minutas-omelettes', name: 'Queso', category: 'Minutas — Omelettes', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'jamon-minutas-omelettes', name: 'Jamón', category: 'Minutas — Omelettes', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
      ]
    },
    {
      id: 'minutas-ensaladas',
      name: 'Minutas — Ensaladas',
      ingredients: [
        { id: 'lechuga-minutas-ensaladas', name: 'Lechuga', category: 'Minutas — Ensaladas', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'tomate-minutas-ensaladas', name: 'Tomate', category: 'Minutas — Ensaladas', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'zanahoria-minutas-ensaladas', name: 'Zanahoria', category: 'Minutas — Ensaladas', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'huevo-minutas-ensaladas', name: 'Huevo', category: 'Minutas — Ensaladas', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'atun-minutas-ensaladas', name: 'Atún', category: 'Minutas — Ensaladas', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'queso-minutas-ensaladas', name: 'Queso', category: 'Minutas — Ensaladas', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
      ]
    },
    {
      id: 'salsas-y-condimentos',
      name: 'Salsas y condimentos',
      ingredients: [
        { id: 'sal-salsas-y-condimentos', name: 'Sal', category: 'Salsas y condimentos', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'pimienta-salsas-y-condimentos', name: 'Pimienta', category: 'Salsas y condimentos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'oregano-salsas-y-condimentos', name: 'Orégano', category: 'Salsas y condimentos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'pimenton-salsas-y-condimentos', name: 'Pimentón', category: 'Salsas y condimentos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'aji-molido-salsas-y-condimentos', name: 'Ají molido', category: 'Salsas y condimentos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'comino-salsas-y-condimentos', name: 'Comino', category: 'Salsas y condimentos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'nuez-moscada-salsas-y-condimentos', name: 'Nuez moscada', category: 'Salsas y condimentos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'provenzal-salsas-y-condimentos', name: 'Provenzal', category: 'Salsas y condimentos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'mostaza-salsas-y-condimentos', name: 'Mostaza', category: 'Salsas y condimentos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'ketchup-salsas-y-condimentos', name: 'Ketchup', category: 'Salsas y condimentos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'mayonesa-salsas-y-condimentos', name: 'Mayonesa', category: 'Salsas y condimentos', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'salsa-golf-salsas-y-condimentos', name: 'Salsa golf', category: 'Salsas y condimentos', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'salsa-barbacoa-salsas-y-condimentos', name: 'Salsa barbacoa', category: 'Salsas y condimentos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'salsa-picante-salsas-y-condimentos', name: 'Salsa picante', category: 'Salsas y condimentos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'vinagre-salsas-y-condimentos', name: 'Vinagre', category: 'Salsas y condimentos', stock: 20, unit: 'litros', minStock: 5, lastUpdated: now },
        { id: 'aceto-balsamico-salsas-y-condimentos', name: 'Aceto balsámico', category: 'Salsas y condimentos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'salsa-de-soja-salsas-y-condimentos', name: 'Salsa de soja', category: 'Salsas y condimentos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'conservas',
      name: 'Conservas',
      ingredients: [
        { id: 'tomate-triturado-conservas', name: 'Tomate triturado', category: 'Conservas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'pure-de-tomate-conservas', name: 'Puré de tomate', category: 'Conservas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'atun-conservas', name: 'Atún', category: 'Conservas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'choclo-conservas', name: 'Choclo', category: 'Conservas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'arvejas-conservas', name: 'Arvejas', category: 'Conservas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'aceitunas-verdes-conservas', name: 'Aceitunas verdes', category: 'Conservas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'aceitunas-negras-conservas', name: 'Aceitunas negras', category: 'Conservas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'palmitos-conservas', name: 'Palmitos', category: 'Conservas', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'aceites-y-grasas',
      name: 'Aceites y grasas',
      ingredients: [
        { id: 'aceite-de-girasol-aceites-y-grasas', name: 'Aceite de girasol', category: 'Aceites y grasas', stock: 20, unit: 'litros', minStock: 5, lastUpdated: now },
        { id: 'aceite-de-oliva-aceites-y-grasas', name: 'Aceite de oliva', category: 'Aceites y grasas', stock: 20, unit: 'litros', minStock: 5, lastUpdated: now },
        { id: 'margarina-aceites-y-grasas', name: 'Margarina', category: 'Aceites y grasas', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'grasa-vacuna-aceites-y-grasas', name: 'Grasa vacuna', category: 'Aceites y grasas', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
      ]
    },
    {
      id: 'reposteria',
      name: 'Repostería y postres básicos',
      ingredients: [
        { id: 'harina-reposteria', name: 'Harina', category: 'Repostería y postres básicos', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'azucar-reposteria', name: 'Azúcar', category: 'Repostería y postres básicos', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'huevos-reposteria', name: 'Huevos', category: 'Repostería y postres básicos', stock: 20, unit: 'unidades', minStock: 3, lastUpdated: now },
        { id: 'leche-reposteria', name: 'Leche', category: 'Repostería y postres básicos', stock: 20, unit: 'litros', minStock: 3, lastUpdated: now },
        { id: 'manteca-reposteria', name: 'Manteca', category: 'Repostería y postres básicos', stock: 20, unit: 'kg', minStock: 3, lastUpdated: now },
        { id: 'chocolate-reposteria', name: 'Chocolate', category: 'Repostería y postres básicos', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'dulce-de-leche-reposteria', name: 'Dulce de leche', category: 'Repostería y postres básicos', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'crema-de-leche-reposteria', name: 'Crema de leche', category: 'Repostería y postres básicos', stock: 20, unit: 'litros', minStock: 3, lastUpdated: now },
        { id: 'esencia-de-vainilla-reposteria', name: 'Esencia de vainilla', category: 'Repostería y postres básicos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
        { id: 'cacao-en-polvo-reposteria', name: 'Cacao en polvo', category: 'Repostería y postres básicos', stock: 20, unit: 'kg', minStock: 5, lastUpdated: now },
        { id: 'gelatina-reposteria', name: 'Gelatina', category: 'Repostería y postres básicos', stock: 20, unit: 'unidades', minStock: 5, lastUpdated: now },
      ]
    },
  ];

  return categories;
}
