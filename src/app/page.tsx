"use client";

import React from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { MdInventory2, MdError, MdSyncAlt, MdWarning, MdCancel } from "react-icons/md";

// JSONs (en la RAÍZ del proyecto carpeta `data/`)
import productsData from "../../data/productos.json";
import movementsData from "../../data/movements.json";

// ===================== Tipos locales (para no depender de otros imports) =====================
type MovementType = "Stock In" | "Stock Out";
type Movement = {
  id: string;
  date: string;     // ISO date string
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
};

type Status = "Available" | "Restock Soon" | "Out of Stock";

type Product = {
  sku: string;
  nombre: string;
  categoria: string;
  stock: number;        // stock base del JSON de productos
  // puede venir un "estado" en el JSON, pero lo recalculamos
};

// ===================== Helpers =====================
const formatDate = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Soporta ambas estructuras de movements.json:
// { "movements": [...] }  ó  [ ... ]
const movements: Movement[] =
  ((movementsData as any).movements ?? (movementsData as any)) as Movement[];

// ===================== Cálculos de movimientos (Delta por SKU) =====================
const movementDeltaBySku = movements.reduce((acc: Record<string, number>, m) => {
  const sign = m.movement === "Stock In" ? 1 : -1;
  acc[m.sku] = (acc[m.sku] ?? 0) + sign * m.quantity;
  return acc;
}, {});

// Productos con stock EFECTIVO y estado derivado
const rawProducts: Product[] = (productsData as any).productos;
const productsWithEffective = rawProducts.map((p) => {
  const delta = movementDeltaBySku[p.sku] ?? 0;
  const effectiveStock = (p.stock ?? 0) + delta;

  const status: Status =
    effectiveStock <= 0 ? "Out of Stock" :
    effectiveStock <= 5 ? "Restock Soon" :
    "Available";

  return { ...p, effectiveStock, status };
});

// ===================== Métricas Dashboard =====================
// Total productos y Low Stock usando el stock EFECTIVO
const totalProducts = productsWithEffective.length;
const lowStock = productsWithEffective.filter((p) => p.status !== "Available").length;

// Último movimiento (fecha más reciente)
const lastMovementDate: Date | null =
  movements.length > 0
    ? movements
        .map((m) => new Date(m.date))
        .sort((a, b) => b.getTime() - a.getTime())[0]
    : null;

const lastMovement = lastMovementDate ? formatDate(lastMovementDate) : "—";

// Movimientos de HOY (para la tarjeta “RECENT MOVEMENTS”)
const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);
const startOfTomorrow = new Date(startOfToday);
startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

const recentMovements = movements.filter((m) => {
  const d = new Date(m.date);
  return d >= startOfToday && d < startOfTomorrow;
}).length;

// ===================== Componente =====================
export default function Page() {
  const [sidebarWidth, setSidebarWidth] = React.useState("64px");

  return (
    <div className="flex h-screen" style={{ margin: 0, padding: 0 }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-8 bg-[#f5f5f5] min-h-screen">
          {/* Dashboard Title */}
          <h1 className="text-2xl mb-4" style={{ fontWeight: "bold", color: "#1F2937" }}>
            Dashboard Statistics
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {/* Total Products */}
            <div className="bg-white rounded-xl shadow p-8 flex flex-col justify-between min-h-[180px] border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-500 tracking-wide">TOTAL PRODUCTS</span>
                <span className="bg-gray-100 rounded-full p-3">
                  <MdInventory2 className="text-[#3F54CE]" size={36} />
                </span>
              </div>
              <div className="mt-6 mb-3 flex flex-col items-start">
                <span className="text-5xl font-extrabold text-[#3F54CE]">{totalProducts}</span>
                <span className="text-3xl font-extrabold text-[#3F54CE]">Products</span>
              </div>
              <div className="text-base text-green-600 font-semibold flex items-center gap-1">
                ↑ +5% since Last Week
              </div>
            </div>

            {/* Low Stock */}
            <div className="bg-white rounded-xl shadow p-8 flex flex-col justify-between min-h-[180px] border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-500 tracking-wide">LOW STOCK</span>
                <span className="bg-gray-100 rounded-full p-3">
                  <MdError className="text-[#FF3B3B]" size={36} />
                </span>
              </div>
              <div className="mt-6 mb-3 flex flex-col items-start">
                <span className="text-5xl font-extrabold text-[#FF3B3B]">{lowStock}</span>
                <span className="text-3xl font-extrabold text-[#FF3B3B]">Products</span>
              </div>
              <div className="text-base text-red-500 font-semibold flex items-center gap-1">
                ↓ +5% since Last Week
              </div>
            </div>

            {/* Recent Movements */}
            <div className="bg-white rounded-xl shadow p-8 flex flex-col justify-between min-h-[180px] border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-500 tracking-wide">RECENT MOVEMENTS</span>
                <span className="bg-gray-100 rounded-full p-3">
                  <MdSyncAlt className="text-[#FFB349]" size={36} />
                </span>
              </div>
              <div className="mt-6 mb-3 flex flex-col items-start">
                <span className="text-5xl font-extrabold text-[#FFB349]">{recentMovements}</span>
                <span className="text-3xl font-extrabold text-[#FFB349]">Movements</span>
              </div>
              <div className="text-base text-gray-500 font-semibold">
                Last Movement: {lastMovement}
              </div>
            </div>
          </div>

          {/* Low Stock Products Table (con stock EFECTIVO) */}
          <div className="bg-[#f5f5f5] p-6 rounded-xl shadow mb-8">
            <h1 className="text-2xl mb-4" style={{ fontWeight: "bold", color: "#1F2937" }}>
              Low Stock Products
            </h1>
            <table className="w-full border-collapse rounded shadow">
              <thead>
                <tr className="bg-[#FFB349] text-[#1F2937]">
                  <th className="p-2 text-center">SKU</th>
                  <th className="p-2 text-center">Product</th>
                  <th className="p-2 text-center">Category</th>
                  <th className="p-2 text-center">Stock</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {productsWithEffective
                  .filter((p) => p.status === "Restock Soon" || p.status === "Out of Stock")
                  .map((p, idx) => (
                    <tr key={p.sku} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                      <td className="p-2 text-center">{p.sku}</td>
                      <td className="p-2 text-left">{p.nombre}</td>
                      <td className="p-2 text-center">{p.categoria}</td>
                      <td className="p-2 text-center">{(p as any).effectiveStock}</td>
                      <td className="p-2 text-center">
                        {(p as any).status === "Restock Soon" && (
                          <span className="flex items-center justify-center gap-1 text-yellow-600 font-semibold">
                            <MdWarning className="text-yellow-500" size={18} />
                            Restock Soon
                          </span>
                        )}
                        {(p as any).status === "Out of Stock" && (
                          <span className="flex items-center justify-center gap-1 text-red-600 font-semibold">
                            <MdCancel className="text-red-500" size={18} />
                            Out of Stock
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
