"use client";

import React, { useState, useMemo } from "react";
import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import movementsData from "../../../data/movements.json";

// Si tienes tipos, ajusta la ruta a tu archivo de tipos:
export type MovementType = "Stock In" | "Stock Out";
export interface Movement {
  id: string;
  date: string;      // ISO
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
}

const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
};

export default function MovementsPage() {
  const [sidebarWidth, setSidebarWidth] = useState("64px");

  // Soporta { movements: [...] } o arreglo directo [...]
  const movements: Movement[] = useMemo(
    () => ((movementsData as any).movements ?? (movementsData as any)) as Movement[],
    []
  );

  const sorted = useMemo(
    () => [...movements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [movements]
  );

  const last = sorted[0];

  return (
    <div className="flex h-screen" style={{ margin: 0, padding: 0 }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-8 bg-[#f5f5f5] min-h-screen">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#1F2937]">Movements</h1>
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

          <div className="bg-white rounded-xl shadow border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FFB34922] text-[#1F2937]">
                  <th className="p-3 text-left">Fecha</th>
                  <th className="p-3 text-left">SKU</th>
                  <th className="p-3 text-left">Producto</th>
                  <th className="p-3 text-left">Movimiento</th>
                  <th className="p-3 text-right">Cantidad</th>
                  <th className="p-3 text-left">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((m) => (
                  <tr key={m.id} className="odd:bg-white even:bg-gray-50">
                    <td className="p-3">{fmtDateTime(m.date)}</td>
                    <td className="p-3">{m.sku}</td>
                    <td className="p-3">{m.product}</td>
                    <td className="p-3">
                      <span
                        className={
                          m.movement === "Stock In"
                            ? "text-green-700 font-medium"
                            : "text-red-700 font-medium"
                        }
                      >
                        {m.movement}
                      </span>
                    </td>
                    <td className="p-3 text-right">{m.quantity}</td>
                    <td className="p-3">{m.user}</td>
                  </tr>
                ))}

                {sorted.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-gray-500" colSpan={6}>
                      No hay movimientos aún.
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
