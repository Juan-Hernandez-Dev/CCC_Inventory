"use client";

import React from "react";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { MdInventory2, MdError, MdSyncAlt, MdWarning, MdCancel } from "react-icons/md";
// Los movimientos siguen viniendo del JSON + (opcional) localStorage
import movementsJSON from "../../data/movements.json";

type MovementType = "Stock In" | "Stock Out";
type Movement = {
  id: string;
  date: string; // ISO
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
  stock: number;
  precio?: number;
  estado?: string;
};

type Status = "Available" | "Restock Soon" | "Out of Stock";

export default function DashboardPage() {
  const [sidebarWidth, setSidebarWidth] = React.useState("64px");

  // -------- Productos desde la API (vivos) --------
  const [products, setProducts] = React.useState<Product[]>([]);
  const loadProducts = React.useCallback(async () => {
    const res = await fetch("/api/products", { cache: "no-store" });
    const json = await res.json();
    setProducts(json.productos ?? []);
  }, []);

  // -------- Movimientos: JSON base + (opcional) localStorage --------
  const baseMovements = React.useMemo(
    () => ((movementsJSON as any).movements ?? (movementsJSON as any)) as Movement[],
    []
  );
  const [userMovements, setUserMovements] = React.useState<Movement[]>([]);
  const loadUserMovements = React.useCallback(() => {
    try {
      const raw = localStorage.getItem("userMovements");
      const arr = raw ? JSON.parse(raw) : [];
      setUserMovements(Array.isArray(arr) ? arr : []);
    } catch {
      setUserMovements([]);
    }
  }, []);

  // Cargar y refrescar al volver a la pestaña o si otra pestaña escribe en LS
  React.useEffect(() => {
    loadProducts();
    loadUserMovements();

    const onFocus = () => {
      loadProducts();
      loadUserMovements();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "userMovements") loadUserMovements();
    };

    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadProducts, loadUserMovements]);

  // -------- Unir movimientos y calcular deltas --------
  const allMovements = React.useMemo(
    () => [...baseMovements, ...userMovements],
    [baseMovements, userMovements]
  );

  const deltaBySku = React.useMemo(() => {
    return allMovements.reduce((acc: Record<string, number>, m) => {
      const sign = m.movement === "Stock In" ? 1 : -1;
      acc[m.sku] = (acc[m.sku] ?? 0) + sign * m.quantity;
      return acc;
    }, {});
  }, [allMovements]);

  // -------- Derivar stock efectivo + estado --------
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

  // -------- Métricas --------
  const totalProducts = derivedProducts.length;
  const lowStock = derivedProducts.filter((p) => p.stock <= 5).length;
  const recentMovements = allMovements.length;
  const lastMovement = React.useMemo(() => {
    if (allMovements.length === 0) return "—";
    const latest = allMovements.reduce((a, b) =>
      new Date(a.date).getTime() > new Date(b.date).getTime() ? a : b
    );
    const d = new Date(latest.date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }, [allMovements]);

  return (
    <div className="flex h-screen" style={{ margin: 0, padding: 0 }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-8 bg-[#f5f5f5] min-h-screen">
          {/* Título */}
          <h1 className="text-2xl mb-4" style={{ fontWeight: "bold", color: "#1F2937" }}>
            Dashboard Statistics
          </h1>

          {/* Cards */}
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
                {derivedProducts
                  .filter((p) => p.estado === "Restock Soon" || p.estado === "Out of Stock")
                  .map((p, idx) => (
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
