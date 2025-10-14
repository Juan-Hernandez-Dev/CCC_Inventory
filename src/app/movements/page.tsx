// Le indicamos a Next.js que este es un "Componente de Cliente",
// por lo que se ejecuta en el navegador y puede interactuar con el usuario.
"use client";

// Importamos las herramientas de React, componentes de la interfaz, iconos y el componente Link de Next.js.
import React, { useState, useMemo, useEffect, useCallback } from "react";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import { MdSearch, MdFilterList, MdEdit } from "react-icons/md";
import Link from "next/link";

// --- Definiciones de Tipos ---
// Define la estructura de datos para un movimiento y un producto.
export type MovementType = "Stock In" | "Stock Out";
export interface Movement {
  id: string;
  date: string; // Fecha en formato ISO
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
  categoria?: string; // La categoría es opcional aquí porque se añade después.
}
type Product = {
  sku: string;
  nombre: string;
  categoria: string;
  stock: number;
  precio: number;
};

// --- Constantes ---
// Una lista predefinida de categorías para los filtros.
const CATEGORY_OPTIONS = [
  "BOLSAS", "FERRETERIA", "PERFUMERIA", "LIQ. 5 LITROS", "ESCOBAS", "FIBRAS",
  "LIQ. 1 LITRO", "JARCERIA", "PASTILLA/AROMA", "PAPEL", "VENENO", "DESPACHADORES",
  "LIQ. 500 ML", "TRAPADORES BG", "DULCERIA",
];

// --- Funciones de Ayuda ---
// Formatea una fecha para que se vea legible. Intenta varios formatos por si la fecha viene "rara".
const fmtDateTime = (raw?: string) => {
  if (!raw) return "—"; // Si no hay fecha, devuelve un guion.
  let d = new Date(raw);
  // Si la fecha es válida, la formatea.
  if (!Number.isNaN(d.getTime())) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  }
  // Si falla, intenta con otro formato común (DD/MM/YYYY HH:mm:ss).
  const m = raw.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (m) {
    // ... lógica para reconstruir la fecha a partir del formato específico ...
    const [, dd, mm, yyyy, hh = 0, mi = 0, ss = 0] = m.map(Number);
    d = new Date(yyyy, mm - 1, dd, hh, mi, ss);
    if (!Number.isNaN(d.getTime())) {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(d);
    }
  }
  // Si nada funciona, devuelve un guion.
  return "—";
};

// --- Componente Principal de la Página ---
export default function MovementsPage() {
  // Estado para el ancho de la barra lateral.
  const [sidebarWidth, setSidebarWidth] = useState("64px");

  // --- Estados para los Datos de la API ---
  const [movementsApi, setMovementsApi] = useState<Movement[]>([]); // Datos crudos de movimientos.
  const [productsApi, setProductsApi] = useState<Product[]>([]);   // Datos crudos de productos.

  // --- Carga de Datos ---
  // Función para cargar los movimientos desde la API. `useCallback` evita que se recree en cada render.
  const loadMovements = useCallback(async () => {
    const res = await fetch("/api/movements", { cache: "no-store" });
    const json = await res.json();
    setMovementsApi(json.movements ?? []);
  }, []);

  // Función para cargar los productos desde la API.
  const loadProducts = useCallback(async () => {
    const res = await fetch("/api/products", { cache: "no-store" });
    const json = await res.json();
    setProductsApi(json.productos ?? []);
  }, []);

  // Efecto que carga los datos al iniciar y cuando el usuario vuelve a la pestaña.
  useEffect(() => {
    loadMovements();
    loadProducts();

    // Esta función recarga los datos si el usuario cambia de pestaña y vuelve.
    const onFocus = () => {
      loadMovements();
      loadProducts();
    };
    window.addEventListener("focus", onFocus);
    // Limpiamos el evento cuando el componente se desmonta.
    return () => window.removeEventListener("focus", onFocus);
  }, [loadMovements, loadProducts]);

  // --- Procesamiento de Datos ---
  // Crea un mapa para buscar rápidamente la categoría de un producto por su SKU.
  // `useMemo` optimiza esto para que no se recalcule innecesariamente.
  const skuToCategory = useMemo(() => {
    const map = new Map<string, string>();
    productsApi.forEach((p) => map.set(p.sku, p.categoria));
    return map;
  }, [productsApi]);

  // Añade la categoría a cada movimiento usando el mapa anterior.
  const movements: Movement[] = useMemo(
    () =>
      movementsApi.map((m) => ({
        ...m,
        categoria: skuToCategory.get(m.sku) ?? "",
      })),
    [movementsApi, skuToCategory]
  );

  // Ordena los movimientos por fecha, del más reciente al más antiguo.
  const sorted = useMemo(
    () =>
      [...movements].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [movements]
  );

  // Guarda el último movimiento para mostrarlo en un resumen.
  const last = sorted[0];

  // --- Estados para los Filtros ---
  const [search, setSearch] = useState(""); // Para el campo de búsqueda de texto.
  const [category, setCategory] = useState(""); // Para el filtro de categoría.
  const [movementType, setMovementType] = useState<"" | MovementType>(""); // Para el filtro de tipo de movimiento.

  // Crea una lista de categorías para el selector, combinando las fijas y las que existan en los datos.
  const categories = useMemo(() => {
    const set = new Set(CATEGORY_OPTIONS);
    movements.forEach((m) => m.categoria && set.add(m.categoria));
    return Array.from(set).sort();
  }, [movements]);

  // Estado para guardar la lista de movimientos ya filtrada.
  const [filtered, setFiltered] = useState(sorted);

  // Efecto que aplica los filtros cada vez que cambia la búsqueda, un filtro o los datos ordenados.
  useEffect(() => {
    const term = search.trim().toLowerCase();
    setFiltered(
      sorted.filter((m) => {
        // Comprueba si el texto de búsqueda coincide con SKU, producto o usuario.
        const matchesSearch =
          term === "" ||
          m.sku.toLowerCase().includes(term) ||
          m.product.toLowerCase().includes(term) ||
          m.user.toLowerCase().includes(term);

        // Comprueba los filtros de categoría y tipo de movimiento.
        const matchesCategory = category === "" || m.categoria === category;
        const matchesMovement = movementType === "" || m.movement === movementType;

        // El movimiento se muestra si cumple todas las condiciones.
        return matchesSearch && matchesCategory && matchesMovement;
      })
    );
  }, [search, category, movementType, sorted]);

  // --- Renderizado de la Página (JSX) ---
  return (
    <div className="flex h-screen">
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />

        <div className="p-4 bg-[#f5f5f5] min-h-screen">
          <h1 className="text-2xl mb-4 font-bold">Todos los Movimientos</h1>

          {/* Barra con búsqueda y filtros */}
          <div className="flex space-x-4 mb-6">
            {/* Campo de búsqueda */}
            <div className="flex items-center w-full max-w-md bg-white rounded border">
              <span className="pl-2"><MdSearch size={22} /></span>
              <input
                type="text"
                placeholder="Buscar por SKU, Producto, o Usuario"
                className="flex-1 p-2 outline-none bg-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="pr-2 pl-2 bg-[#FFB349] h-full flex items-center rounded-r">
                <MdFilterList size={22} className="text-white" />
              </span>
            </div>

            {/* Filtro de Categoría */}
            <select
              className="p-2 border rounded bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Categoría</option>
              {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>

            {/* Filtro de Tipo de Movimiento */}
            <select
              className="p-2 border rounded bg-white"
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as MovementType | "")}
            >
              <option value="">Movimiento</option>
              <option value="Stock In">Stock In</option>
              <option value="Stock Out">Stock Out</option>
            </select>

            {/* Botón para añadir un nuevo movimiento */}
            <Link href="/movements/new" className="bg-[#3F54CE] text-white p-2 rounded">
              Añadir Movimiento
            </Link>
          </div>

          {/* Resumen del último movimiento */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              {last ? (
                <>
                  <span className="font-semibold">Último movimiento: </span>
                  <span>{fmtDateTime(last.date)} · {last.movement} · {last.product}</span>
                </>
              ) : (
                <span>Sin movimientos aún</span>
              )}
            </div>
          </div>

          {/* Tabla de movimientos */}
          <div className="rounded-xl shadow overflow-hidden">
            <table className="w-full bg-white">
              {/* Cabecera de la tabla */}
              <thead>
                <tr className="bg-[#FFB349]">
                  {/* ...Títulos de las columnas... */}
                </tr>
              </thead>
              {/* Cuerpo de la tabla */}
              <tbody>
                {/* Mapea cada movimiento filtrado a una fila de la tabla */}
                {filtered.map((m, idx) => {
                  // Crea una 'key' única y segura para cada fila, incluso si no hay ID.
                  const safeKey = m.id || `${m.sku}-${m.date}-${idx}`;
                  // Verifica si el movimiento tiene un ID para poder editarlo.
                  const hasId = Boolean(m.id);

                  return (
                    <tr key={safeKey} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                      <td className="p-2 text-center">{fmtDateTime(m.date)}</td>
                      <td className="p-2 text-center">{m.sku}</td>
                      <td className="p-2 text-center">{m.product}</td>
                      <td className="p-2 text-center">{m.categoria || "—"}</td>
                      <td className="p-2 text-center">
                        <span className={m.movement === "Stock In" ? "text-green-700" : "text-red-700"}>
                          {m.movement}
                        </span>
                      </td>
                      <td className="p-2 text-center">{m.quantity}</td>
                      <td className="p-2 text-center">{m.user}</td>
                      <td className="p-2 text-center">
                        {/* Muestra el botón de editar solo si hay un ID */}
                        {hasId ? (
                          <Link href={`/movements/${m.id}/edit`} title="Edit">
                            <MdEdit size={18} />
                          </Link>
                        ) : (
                          <button disabled title="No id">
                            <MdEdit size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Mensaje si no hay resultados con los filtros aplicados */}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-500">
                      No hay movimientos con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}