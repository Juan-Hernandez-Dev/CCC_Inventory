"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import ProductsTable from "../../../components/ProductsTable";
import Sidebar from "../../../components/Sidebar";
import React from "react";
import { MdSearch, MdFilterList } from "react-icons/md";

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
  stock: number;
  precio: number;
  estado?: string;
};
type Status = "Available" | "Restock Soon" | "Out of Stock";

const CATEGORY_OPTIONS = [
  "BOLSAS","FERRETERIA","PERFUMERIA","LIQ. 5 LITROS","ESCOBAS","FIBRAS",
  "LIQ. 1 LITRO","JARCERIA","PASTILLA/AROMA","PAPEL","VENENO","DESPACHADORES",
  "LIQ. 500 ML","TRAPADORES BG","DULCERIA"
];

export default function Page() {
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = React.useState("64px");
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [status, setStatus] = React.useState("");

  // Products API
  const [products, setProducts] = React.useState<Product[]>([]);
  const loadProducts = React.useCallback(async () => {
    const res = await fetch("/api/products", { cache: "no-store" });
    const json = await res.json();
    setProducts(json.productos ?? []);
  }, []);

  // Movements API
  const [movements, setMovements] = React.useState<Movement[]>([]);
  const loadMovements = React.useCallback(async () => {
    const res = await fetch("/api/movements", { cache: "no-store" });
    const json = await res.json();
    setMovements(json.movements ?? []);
  }, []);

  React.useEffect(() => {
    loadProducts();
    loadMovements();
    const onFocus = () => { loadProducts(); loadMovements(); };
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [loadProducts, loadMovements]);

  // Delta por SKU
  const deltaBySku = React.useMemo(() => {
    return movements.reduce((acc: Record<string, number>, m) => {
      const sign = m.movement === "Stock In" ? 1 : -1;
      acc[m.sku] = (acc[m.sku] ?? 0) + sign * m.quantity;
      return acc;
    }, {});
  }, [movements]);

  // Derivar stock/estado
  const derived = React.useMemo(() => {
    return products.map((p) => {
      const effectiveStock = (p.stock ?? 0) + (deltaBySku[p.sku] ?? 0);
      const derivedStatus: Status =
        effectiveStock <= 0 ? "Out of Stock" :
        effectiveStock <= 5 ? "Restock Soon" :
        "Available";
      return { ...p, stock: effectiveStock, estado: derivedStatus as string };
    });
  }, [products, deltaBySku]);

  // Filtros
  const [filtered, setFiltered] = React.useState(derived);
  React.useEffect(() => {
    const term = search.toLowerCase();
    setFiltered(
      derived.filter(
        (p) =>
          (p.sku.toLowerCase().includes(term) || p.nombre.toLowerCase().includes(term)) &&
          (category === "" || p.categoria === category) &&
          (status === "" || (p.estado as string) === status)
      )
    );
  }, [search, category, status, derived]);

  // Edit/Delete
  const handleEdit = (p: Product) => {
    router.push(`/products/edit?sku=${encodeURIComponent(p.sku)}`);
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete product ${p.sku} - ${p.nombre}?`)) return;
    const res = await fetch(`/api/products/${encodeURIComponent(p.sku)}`, { method: "DELETE" });
    if (!res.ok) {
      let msg = "Could not delete product.";
      try { msg = (await res.json())?.error ?? msg; } catch {}
      alert(msg);
      return;
    }
    await loadProducts();
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

          <div className="flex space-x-4 mb-4">
            <div className="flex items-center w-full max-w-md bg-white rounded border">
              <span className="pl-2 text-gray-400"><MdSearch size={22} /></span>
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

            <select className="p-2 border rounded bg-white" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Category</option>
              {CATEGORY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>

            <select className="p-2 border rounded bg-white" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Status</option>
              <option value="Available">Available</option>
              <option value="Restock Soon">Restock Soon</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            <Link href="/products/new" className="bg-[#3F54CE] text-white p-2 rounded hover:bg-blue-600 transition-colors">
              Add Product
            </Link>
          </div>

          <ProductsTable products={filtered as any} onEdit={handleEdit} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}
