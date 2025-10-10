"use client";

import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import React from "react";
import data from '../../data/productos.json';
import movementsData from "../../data/movements.json";
import { MdInventory2, MdError, MdSyncAlt, MdWarning, MdCancel } from "react-icons/md";
import type { Movement } from "../types_movements/movements"; 

export default function Page() {
  const [sidebarWidth, setSidebarWidth] = React.useState('64px');

  // --- Métricas de productos ---
  const totalProducts = (data as any).productos.length;
  const lowStock = (data as any).productos.filter((p: any) => p.stock <= 5).length;

  // --- Helper: dd/MM/yyyy ---
  const formatDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // --- Movimientos desde JSON ---
  // Soporta ambas estructuras: { movements: [...] } o directamente [...]
  const movements: Movement[] =
    ((movementsData as any).movements ?? (movementsData as any)) as Movement[];

  // Último movimiento (fecha más reciente)
  const lastMovementDate: Date | null =
    movements.length > 0
      ? movements
          .map(m => new Date(m.date))
          .sort((a, b) => b.getTime() - a.getTime())[0]
      : null;

  const lastMovement = lastMovementDate ? formatDate(lastMovementDate) : "—";

  // Movimientos de HOY (para la tarjeta “RECENT MOVEMENTS”)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const recentMovements = movements.filter(m => {
    const d = new Date(m.date);
    return d >= startOfToday && d < startOfTomorrow;
  }).length;

  return (
    <div className="flex h-screen" style={{ margin: 0, padding: 0 }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-8 bg-[#f5f5f5] min-h-screen">
          {/* Dashboard Title */}
          <h1 className="text-2xl mb-4" style={{ fontWeight: 'bold', color: '#1F2937' }}>
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

          {/* Low Stock Products Table */}
          <div className="bg-[#f5f5f5] p-6 rounded-xl shadow mb-8">
            <h1 className="text-2xl mb-4" style={{ fontWeight: 'bold', color: '#1F2937' }}>Low Stock Products</h1>
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
                {(data as any).productos
                  .filter((p: any) => p.estado === "Restock Soon" || p.estado === "Out of Stock")
                  .map((p: any, idx: number) => (
                    <tr key={p.sku} className={idx % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                      <td className="p-2 text-center">{p.sku}</td>
                      <td className="p-2 text-left">{p.nombre}</td>
                      <td className="p-2 text-center">{p.categoria}</td>
                      <td className="p-2 text-center">{p.stock}</td>
                      <td className="p-2 text-center">
                        {p.estado === "Restock Soon" && (
                          <span className="flex items-center justify-center gap-1 text-yellow-600 font-semibold">
                            <MdWarning className="text-yellow-500" size={18} />
                            Restock Soon
                          </span>
                        )}
                        {p.estado === "Out of Stock" && (
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
