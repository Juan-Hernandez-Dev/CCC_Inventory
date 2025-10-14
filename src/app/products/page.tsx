// Le decimos a Next.js que este componente se ejecuta en el navegador del usuario,
// lo que nos permite usar funciones interactivas como el estado (useState).
"use client";

// Importamos las herramientas necesarias de React, nuestros componentes, íconos y funciones de Next.js.
import React from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ProductsTable from "@/components/ProductsTable";
import Link from "next/link";
import { MdSearch, MdFilterList } from "react-icons/md";
import { useRouter } from "next/navigation";

// --- Definición de Tipos ---
// Aquí definimos la "forma" que tienen nuestros datos para evitar errores.
type MovementType = "Stock In" | "Stock Out";
type Movement = {
  id: string;
  date: string;
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
};

type Product = {
  sku: string;
  nombre: string;
  categoria: string;
  stock: number; // Este es el stock "base" que viene del archivo de la base de datos.
  precio: number;
  estado?: "Available" | "Restock Soon" | "Out of Stock"; // El estado se calcula después.
};

// Una lista fija con todas las categorías de productos para el menú de filtro.
const CATEGORY_OPTIONS = [
  "BOLSAS", "FERRETERIA", "PERFUMERIA", "LIQ. 5 LITROS", "ESCOBAS", "FIBRAS",
  "LIQ. 1 LITRO", "JARCERIA", "PASTILLA/AROMA", "PAPEL", "VENENO", "DESPACHADORES",
  "LIQ. 500 ML", "TRAPADORES BG", "DULCERIA",
];

// Una función de ayuda que determina el estado de un producto según su nivel de stock.
const calcStatus = (stock: number): Product["estado"] => {
  if (stock <= 0) return "Out of Stock";
  if (stock <= 5) return "Restock Soon";
  return "Available";
};


// --- El Componente Principal de la Página ---
export default function ProductsPage() {
  // Hook para manejar la navegación entre páginas.
  const router = useRouter();
  // Estado para gestionar el ancho de la barra lateral y ajustar el diseño.
  const [sidebarWidth, setSidebarWidth] = React.useState("64px");

  // --- Estados para Cargar Datos ---
  // Almacena la lista de productos "en crudo" que viene de la API.
  const [baseProducts, setBaseProducts] = React.useState<Product[]>([]);
  // Almacena la lista de todos los movimientos de stock que viene de la API.
  const [movements, setMovements] = React.useState<Movement[]>([]);

  // Función para obtener los productos y los movimientos al mismo tiempo.
  const loadAll = React.useCallback(async () => {
    // Iniciamos ambas peticiones a la API en paralelo para que sea más rápido.
    const [pRes, mRes] = await Promise.all([
      fetch("/api/products", { cache: "no-store" }), // "no-store" asegura que siempre tengamos datos frescos.
      fetch("/api/movements", { cache: "no-store" }),
    ]);
    // Cuando terminan, obtenemos los datos en formato JSON.
    const pJson = await pRes.json();
    const mJson = await mRes.json();
    // Y finalmente, actualizamos el estado de nuestro componente.
    setBaseProducts(pJson.productos ?? []);
    setMovements(mJson.movements ?? []);
  }, []); // `useCallback` evita que esta función se cree de nuevo en cada renderizado.

  // Este efecto se ejecuta cuando la página se carga.
  React.useEffect(() => {
    loadAll(); // Carga los datos la primera vez.
    // También configuramos un evento para que recargue los datos si el usuario cambia de pestaña y vuelve.
    const onFocus = () => loadAll();
    document.addEventListener("visibilitychange", onFocus);
    // Limpieza: quitamos el evento cuando el componente se desmonta para evitar problemas.
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [loadAll]);

  // --- Lógica para Calcular el Stock ---
  // El stock que ves en la tabla no es el del archivo, es: `stockBase + todos los movimientos`.
  // Esta parte calcula el cambio total (+ o -) en el stock de cada producto.
  const deltaBySku = React.useMemo(() => {
    // Recorremos todos los movimientos y los vamos sumando por cada SKU.
    return movements.reduce((acc: Record<string, number>, m) => {
      const sign = m.movement === "Stock In" ? 1 : -1; // "Stock In" suma, "Stock Out" resta.
      acc[m.sku] = (acc[m.sku] ?? 0) + sign * Number(m.quantity || 0);
      return acc;
    }, {});
  }, [movements]); // `useMemo` asegura que este cálculo pesado solo se ejecute cuando cambian los movimientos.

  // Ahora, creamos la lista final de productos que se mostrará al usuario.
  const derivedProducts = React.useMemo<Product[]>(() => {
    // Por cada producto de nuestra lista base...
    return baseProducts.map((p) => {
      // ...calculamos su stock "efectivo" o en tiempo real.
      const effectiveStock = Number(p.stock ?? 0) + Number(deltaBySku[p.sku] ?? 0);
      // Devolvemos un nuevo objeto de producto con el stock actualizado y su estado ya calculado.
      return {
        ...p,
        stock: effectiveStock,
        estado: calcStatus(effectiveStock),
      };
    });
  }, [baseProducts, deltaBySku]); // Esto solo se vuelve a calcular si cambian los productos base o los deltas.

  // --- Lógica de Filtrado y Búsqueda ---
  // Estados para guardar lo que el usuario selecciona en los filtros.
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState<"" | NonNullable<Product["estado"]>>("");

  // Este estado guardará la lista final de productos ya filtrada.
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([]);
  // Este efecto aplica los filtros cada vez que cambia un filtro o la lista de productos.
  React.useEffect(() => {
    const term = search.trim().toLowerCase();
    setFilteredProducts(
      derivedProducts.filter((p) => {
        // Un producto se mantiene en la lista si cumple con todos los filtros activos.
        const matchesText = term === "" || p.sku.toLowerCase().includes(term) || p.nombre.toLowerCase().includes(term);
        const matchesCategory = category === "" || p.categoria === category;
        const matchesStatus = status === "" || p.estado === status;
        return matchesText && matchesCategory && matchesStatus;
      })
    );
  }, [search, category, status, derivedProducts]);

  // --- Manejadores de Acciones ---
  // Esta función se pasa al componente de la tabla. Cuando se borra un producto allí,
  // actualiza la lista aquí al instante, sin tener que recargar toda la página.
  const handleDeleted = (sku: string) => {
    setBaseProducts((prev) => prev.filter((p) => p.sku !== sku));
  };

  // --- Renderizado ---
  // Esto es lo que se dibuja en la pantalla.
  return (
    <div className="flex h-screen">
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-4">
          <h1 className="text-2xl mb-4 font-bold">Todos los Productos</h1>

          {/* Barra de Filtros */}
          <div className="flex space-x-4 mb-4">
            {/* Campo de Búsqueda */}
            <div className="flex items-center w-full max-w-md bg-white rounded border">
              <span className="pl-2 text-gray-400"><MdSearch size={22} /></span>
              <input
                type="text"
                placeholder="Buscar"
                className="flex-1 p-2 outline-none bg-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="pr-2 pl-2 bg-[#FFB349] h-full flex items-center rounded-r">
                <MdFilterList size={22} className="text-white" />
              </span>
            </div>

            {/* Menú de Categorías */}
            <select
              className="p-2 border rounded bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Categoría</option>
              {CATEGORY_OPTIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>

            {/* Menú de Estado */}
            <select
              className="p-2 border rounded bg-white"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="">Estado</option>
              <option value="Available">Disponible</option>
              <option value="Restock Soon">Poco Stock</option>
              <option value="Out of Stock">Agotado</option>
            </select>

            {/* Botón de Añadir Producto */}
            <Link href="/products/new" className="bg-[#3F54CE] text-white p-2 rounded">
              Añadir Producto
            </Link>
          </div>

          {/* La Tabla de Productos */}
          {/* Le pasamos la lista final filtrada y la función de borrado al componente de la tabla. */}
          <ProductsTable products={filteredProducts} onDeleted={handleDeleted} />
        </div>
      </div>
    </div>
  );
}