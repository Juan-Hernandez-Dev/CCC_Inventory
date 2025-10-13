"use client";

import React from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ProductsTable from "@/components/ProductsTable";
import Link from "next/link";
import { MdSearch, MdFilterList } from "react-icons/md";
import { useRouter } from "next/navigation";

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
  stock: number;   // base del JSON
  precio: number;
  estado?: "Available" | "Restock Soon" | "Out of Stock";
};

const CATEGORY_OPTIONS = [
  "BOLSAS",
  "FERRETERIA",
  "PERFUMERIA",
  "LIQ. 5 LITROS",
  "ESCOBAS",
  "FIBRAS",
  "LIQ. 1 LITRO",
  "JARCERIA",
  "PASTILLA/AROMA",
  "PAPEL",
  "VENENO",
  "DESPACHADORES",
  "LIQ. 500 ML",
  "TRAPADORES BG",
  "DULCERIA",
];

const calcStatus = (stock: number): Product["estado"] => {
  if (stock <= 0) return "Out of Stock";
  if (stock <= 5) return "Restock Soon";
  return "Available";
};

export default function ProductsPage() {
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = React.useState("64px");

  // ===== Carga desde API (sin caché) =====
  const [baseProducts, setBaseProducts] = React.useState<Product[]>([]);
  const [movements, setMovements] = React.useState<Movement[]>([]);
  const loadAll = React.useCallback(async () => {
    const [pRes, mRes] = await Promise.all([
      fetch("/api/products", { cache: "no-store" }),
      fetch("/api/movements", { cache: "no-store" }),
    ]);
    const pJson = await pRes.json();
    const mJson = await mRes.json();
    setBaseProducts(pJson.productos ?? []);
    setMovements(mJson.movements ?? []);
  }, []);

  React.useEffect(() => {
    loadAll();
    const onFocus = () => loadAll();
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [loadAll]);

  // ===== Delta por SKU a partir de movimientos =====
  const deltaBySku = React.useMemo(() => {
    return movements.reduce((acc: Record<string, number>, m) => {
      const sign = m.movement === "Stock In" ? 1 : -1;
      acc[m.sku] = (acc[m.sku] ?? 0) + sign * Number(m.quantity || 0);
      return acc;
    }, {});
  }, [movements]);

  // ===== Productos derivados: stock efectivo + estado =====
  const derivedProducts = React.useMemo<Product[]>(() => {
    return baseProducts.map((p) => {
      const effectiveStock = Number(p.stock ?? 0) + Number(deltaBySku[p.sku] ?? 0);
      return {
        ...p,
        stock: effectiveStock,
        estado: calcStatus(effectiveStock),
      };
    });
  }, [baseProducts, deltaBySku]);

  // ===== Filtros / búsqueda =====
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState<"" | NonNullable<Product["estado"]>>("");

  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>([]);
  React.useEffect(() => {
    const term = search.trim().toLowerCase();
    setFilteredProducts(
      derivedProducts.filter((p) => {
        const matchesText =
          term === "" ||
          p.sku.toLowerCase().includes(term) ||
          p.nombre.toLowerCase().includes(term);
        const matchesCategory = category === "" || p.categoria === category;
        const matchesStatus = status === "" || p.estado === status;
        return matchesText && matchesCategory && matchesStatus;
      })
    );
  }, [search, category, status, derivedProducts]);

  // ===== Al borrar, refrescar lista local sin recargar página =====
  const handleDeleted = (sku: string) => {
    setBaseProducts((prev) => prev.filter((p) => p.sku !== sku));
  };

  return (
    <div className="flex h-screen" style={{ margin: 0, padding: 0 }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-4">
          <h1 className="text-2xl mb-4" style={{ fontWeight: "bold", color: "#1F2937" }}>
            All the Products
          </h1>

          {/* Barra de búsqueda y filtros (misma UI) */}
          <div className="flex space-x-4 mb-4">
            <div className="flex items-center w-full max-w-md bg-white rounded border">
              <span className="pl-2 text-gray-400">
                <MdSearch size={22} />
              </span>
              <input
                type="text"
                placeholder="Search"
                className="flex-1 p-2 outline-none bg-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="pr-2 pl-2 bg-[#FFB349] h-full flex items-center rounded-r">
                <MdFilterList size={22} className="text-white" />
              </span>
            </div>

            <select
              className="p-2 border rounded bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Category</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="p-2 border rounded bg-white"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="">Status</option>
              <option value="Available">Available</option>
              <option value="Restock Soon">Restock Soon</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            {/* <<<<<< Paso 2: botón Add Product a /products/new >>>>>> */}
            <Link
              href="/products/new"
              className="bg-[#3F54CE] text-white p-2 rounded hover:bg-blue-600 transition-colors"
            >
              Add Product
            </Link>
          </div>

          {/* Tabla (recibe productos ya derivados) */}
          <ProductsTable products={filteredProducts} onDeleted={handleDeleted} />
        </div>
      </div>
    </div>
  );
}
