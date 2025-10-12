"use client";

import React, { useState, useMemo, useEffect } from "react";
import Header from "../../../components/Header";
import Sidebar from "../../../components/Sidebar";
import movementsData from "../../../data/movements.json";
import productsData from "../../../data/productos.json";
import { MdSearch, MdFilterList } from "react-icons/md";

// Tipos
export type MovementType = "Stock In" | "Stock Out";
export interface Movement {
  id: string;
  date: string; // ISO
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
  categoria?: string; // categoría agregada dinámicamente
}

// Formato de fecha
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

  // Movimientos base
  const movementsRaw: Movement[] = useMemo(
    () => ((movementsData as any).movements ?? (movementsData as any)) as Movement[],
    []
  );

  // Mapa SKU → categoría (desde productos.json)
  const skuToCategory = useMemo(() => {
    const productos = ((productsData as any).productos ?? (productsData as any)) as Array<{
      sku: string;
      categoria: string;
    }>;
    const map = new Map<string, string>();
    productos.forEach((p) => map.set(p.sku, p.categoria));
    return map;
  }, []);

  // Enriquecer movimientos con categoría
  const movements = useMemo(
    () =>
      movementsRaw.map((m) => ({
        ...m,
        categoria: skuToCategory.get(m.sku) ?? "",
      })),
    [movementsRaw, skuToCategory]
  );

  // Orden descendente
  const sorted = useMemo(
    () => [...movements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [movements]
  );

  const last = sorted[0];

  // Filtros (igual que Products)
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [movementType, setMovementType] = useState<"" | MovementType>("");

  // Categorías únicas
  const categories = useMemo(() => {
    const set = new Set<string>();
    movements.forEach((m) => m.categoria && set.add(m.categoria));
    return Array.from(set).sort();
  }, [movements]);

  // Lista filtrada
  const [filtered, setFiltered] = useState(sorted);

  useEffect(() => {
    const term = search.trim().toLowerCase();
    setFiltered(
      sorted.filter((m) => {
        const matchesSearch =
          term === "" ||
          m.sku.toLowerCase().includes(term) ||
          m.product.toLowerCase().includes(term) ||
          m.user.toLowerCase().includes(term);

        const matchesCategory = category === "" || m.categoria === category;
        const matchesMovement = movementType === "" || m.movement === movementType;

        return matchesSearch && matchesCategory && matchesMovement;
      })
    );
  }, [search, category, movementType, sorted]);

  return (
    <div className="flex h-screen" style={{ margin: 0, padding: 0 }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />

        <div className="p-4 bg-[#f5f5f5] min-h-screen">
          {/* Title */}
          <h1 className="text-2xl mb-4 font-bold text-[#1F2937]">All Movements</h1>

          {/* Search + Filters (idéntico diseño que Products) */}
          <div className="flex space-x-4 mb-6">
            <div className="flex items-center w-full max-w-md bg-white rounded border">
              <span className="pl-2 text-gray-400">
                <MdSearch size={22} />
              </span>
              <input
                type="text"
                placeholder="Search by SKU, Product, or User"
                className="flex-1 p-2 outline-none bg-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="pr-2 pl-2 bg-[#FFB349] h-full flex items-center rounded-r">
                <MdFilterList size={22} className="text-white" />
              </span>
            </div>

            {/* Category Filter */}
            <select
              className="p-2 border rounded bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Movement Type Filter */}
            <select
              className="p-2 border rounded bg-white"
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as MovementType | "")}
            >
              <option value="">Movement</option>
              <option value="Stock In">Stock In</option>
              <option value="Stock Out">Stock Out</option>
            </select>

            {/* Add button */}
            <button
              type="button"
              className="bg-[#3F54CE] text-white p-2 rounded hover:bg-blue-600 transition-colors"
            >
              Add Movement
            </button>
          </div>

          {/* Último movimiento */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              {last ? (
                <>
                  <span className="font-semibold">Último movimiento: </span>
                  <span>
                    {fmtDateTime(last.date)} · {last.movement} · {last.product}
                  </span>
                </>
              ) : (
                <span>Sin movimientos aún</span>
              )}
            </div>
          </div>

          {/* Tabla (mismo formato que Products, sin recuadro externo) */}
          <div className="rounded-xl shadow overflow-hidden">
            <table className="w-full border-collapse bg-white rounded-xl shadow">
              <thead>
                <tr className="bg-[#FFB349] text-[#1F2937]">
                  <th className="p-2 text-center">Fecha</th>
                  <th className="p-2 text-center">SKU</th>
                  <th className="p-2 text-center">Producto</th>
                  <th className="p-2 text-center">Categoría</th>
                  <th className="p-2 text-center">Movimiento</th>
                  <th className="p-2 text-center">Cantidad</th>
                  <th className="p-2 text-center">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, idx) => (
                  <tr
                    key={m.id}
                    className={`${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-100"
                    } hover:bg-[#FFB34922] transition-colors`}
                  >
                    <td className="p-2 text-center">{fmtDateTime(m.date)}</td>
                    <td className="p-2 text-center">{m.sku}</td>
                    <td className="p-2 text-center">{m.product}</td>
                    <td className="p-2 text-center">{m.categoria || "—"}</td>
                    <td className="p-2 text-center">
                      <span
                        className={
                          m.movement === "Stock In"
                            ? "text-green-700 font-semibold"
                            : "text-red-700 font-semibold"
                        }
                      >
                        {m.movement}
                      </span>
                    </td>
                    <td className="p-2 text-center">{m.quantity}</td>
                    <td className="p-2 text-center">{m.user}</td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-500">
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
