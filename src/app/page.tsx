// Le indicamos a Next.js que este componente se ejecuta en el navegador del usuario,
// lo que nos permite usar funciones interactivas como el estado (useState).
"use client";

// Importamos las herramientas necesarias de React, nuestros componentes y los íconos.
import React from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { MdInventory2, MdError, MdSyncAlt, MdWarning, MdCancel } from "react-icons/md";

// --- Definición de Tipos ---
// Definimos la "forma" de nuestros datos para que el código sea más claro y seguro.
type MovementType = "Stock In" | "Stock Out";
type Movement = {
  id: string;
  date: string; // Fecha en formato ISO
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
  stock: number; // Este es el stock "base" del archivo.
  precio?: number;
  estado?: string; // El estado se calcula después.
};
type Status = "Available" | "Restock Soon" | "Out of Stock";

// --- Componente Principal de la Página del Dashboard ---
export default function DashboardPage() {
  // Estado para controlar el ancho de la barra lateral.
  const [sidebarWidth, setSidebarWidth] = React.useState("64px");

  // --- Carga de Datos ---
  // Estado para guardar la lista de productos que viene de la API.
  const [products, setProducts] = React.useState<Product[]>([]);
  // Función para obtener la lista de productos. `useCallback` optimiza su rendimiento.
  const loadProducts = React.useCallback(async () => {
    const res = await fetch("/api/products", { cache: "no-store" }); // "no-store" para datos siempre frescos.
    const json = await res.json();
    setProducts(json.productos ?? []);
  }, []);

  // Estado para guardar la lista de movimientos que viene de la API.
  const [movements, setMovements] = React.useState<Movement[]>([]);
  // Función para obtener la lista de movimientos.
  const loadMovements = React.useCallback(async () => {
    const res = await fetch("/api/movements", { cache: "no-store" });
    const json = await res.json();
    setMovements(json.movements ?? []);
  }, []);

  // Efecto que se ejecuta al cargar la página.
  React.useEffect(() => {
    // Carga los datos iniciales.
    loadProducts();
    loadMovements();

    // Configura un evento para recargar los datos si el usuario cambia de pestaña y vuelve.
    const onFocus = () => {
      loadProducts();
      loadMovements();
    };
    document.addEventListener("visibilitychange", onFocus);
    // Limpia el evento cuando el componente se desmonta para evitar problemas.
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [loadProducts, loadMovements]);

  // --- Procesamiento de Datos ---
  // Calcula el cambio total de stock (entradas - salidas) para cada producto (SKU).
  // `useMemo` hace que este cálculo pesado solo se ejecute cuando los movimientos cambian.
  const deltaBySku = React.useMemo(() => {
    return movements.reduce((acc: Record<string, number>, m) => {
      const sign = m.movement === "Stock In" ? 1 : -1; // Suma para entradas, resta para salidas.
      acc[m.sku] = (acc[m.sku] ?? 0) + sign * m.quantity;
      return acc;
    }, {});
  }, [movements]);

  // Crea una nueva lista de productos con el stock real y un estado calculado.
  // El stock real = stock base del archivo + la suma de todos sus movimientos.
  const derivedProducts = React.useMemo(() => {
    return products.map((p) => {
      const effectiveStock = (p.stock ?? 0) + (deltaBySku[p.sku] ?? 0);
      const derivedStatus: Status =
        effectiveStock <= 0 ? "Out of Stock" :
        effectiveStock <= 5 ? "Restock Soon" :
        "Available";
      return { ...p, stock: effectiveStock, estado: derivedStatus };
    });
  }, [products, deltaBySku]);

  // --- Cálculo de Métricas para el Dashboard ---
  const totalProducts = derivedProducts.length; // Total de productos únicos.
  const lowStock = derivedProducts.filter((p) => p.stock <= 5).length; // Productos con 5 o menos unidades.
  const recentMovements = movements.length; // Total de movimientos registrados.
  // Encuentra la fecha del último movimiento registrado.
  const lastMovement = React.useMemo(() => {
    if (movements.length === 0) return "—";
    const latest = movements.reduce((a, b) =>
      new Date(a.date).getTime() > new Date(b.date).getTime() ? a : b
    );
    const d = new Date(latest.date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }, [movements]);

  // --- Renderizado de la Página (lo que se ve en pantalla) ---
  return (
    <div className="flex h-screen">
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-8 bg-[#f5f5f5] min-h-screen">
          <h1 className="text-2xl mb-4 font-bold">Estadísticas del Dashboard</h1>

          {/* Tarjetas con las métricas principales */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {/* Tarjeta: Total de Productos */}
            <div className="bg-white rounded-xl shadow p-8">
              <div className="flex items-center justify-between">
                <span>TOTAL DE PRODUCTOS</span>
                <span><MdInventory2 className="text-[#3F54CE]" size={36} /></span>
              </div>
              <div className="mt-6 mb-3">
                <span className="text-5xl font-extrabold text-[#3F54CE]">{totalProducts}</span>
                <span className="text-3xl font-extrabold text-[#3F54CE]"> Productos</span>
              </div>
              <div>↑ +5% desde la semana pasada</div>
            </div>

            {/* Tarjeta: Productos con Poco Stock */}
            <div className="bg-white rounded-xl shadow p-8">
              <div className="flex items-center justify-between">
                <span>POCO STOCK</span>
                <span><MdError className="text-[#FF3B3B]" size={36} /></span>
              </div>
              <div className="mt-6 mb-3">
                <span className="text-5xl font-extrabold text-[#FF3B3B]">{lowStock}</span>
                <span className="text-3xl font-extrabold text-[#FF3B3B]"> Productos</span>
              </div>
              <div>↓ +5% desde la semana pasada</div>
            </div>

            {/* Tarjeta: Movimientos Recientes */}
            <div className="bg-white rounded-xl shadow p-8">
              <div className="flex items-center justify-between">
                <span>MOVIMIENTOS RECIENTES</span>
                <span><MdSyncAlt className="text-[#FFB349]" size={36} /></span>
              </div>
              <div className="mt-6 mb-3">
                <span className="text-5xl font-extrabold text-[#FFB349]">{recentMovements}</span>
                <span className="text-3xl font-extrabold text-[#FFB349]"> Movimientos</span>
              </div>
              <div>Último Movimiento: {lastMovement}</div>
            </div>
          </div>

          {/* Tabla de Productos con Poco Stock */}
          <div className="bg-white p-6 rounded-xl shadow mb-8">
            <h1 className="text-2xl mb-4 font-bold">Productos con Poco Stock</h1>
            <table className="w-full">
              {/* Cabecera de la tabla */}
              <thead>
                <tr className="bg-[#FFB349]">
                  <th className="p-2 text-center">SKU</th>
                  <th className="p-2 text-center">Producto</th>
                  <th className="p-2 text-center">Categoría</th>
                  <th className="p-2 text-center">Stock</th>
                  <th className="p-2 text-center">Estado</th>
                </tr>
              </thead>
              {/* Cuerpo de la tabla */}
              <tbody>
                {derivedProducts
                  // Filtramos para mostrar solo los productos con poco stock o agotados.
                  .filter((p) => p.estado === "Restock Soon" || p.estado === "Out of Stock")
                  // Creamos una fila por cada producto encontrado.
                  .map((p, idx) => (
                    <tr key={p.sku} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                      <td className="p-2 text-center">{p.sku}</td>
                      <td className="p-2 text-left">{p.nombre}</td>
                      <td className="p-2 text-center">{p.categoria}</td>
                      <td className="p-2 text-center">{p.stock}</td>
                      <td className="p-2 text-center">
                        {/* Mostramos una etiqueta diferente según el estado del producto */}
                        {p.estado === "Restock Soon" && (
                          <span className="flex items-center justify-center gap-1 text-yellow-600">
                            <MdWarning /> Poco Stock
                          </span>
                        )}
                        {p.estado === "Out of Stock" && (
                          <span className="flex items-center justify-center gap-1 text-red-600">
                            <MdCancel /> Agotado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}