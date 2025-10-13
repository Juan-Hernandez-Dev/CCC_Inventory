"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

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
  stock: number;   // base del JSON (no editable aquí)
  precio: number;
};

const CATEGORY_OPTIONS = [
  "BOLSAS","FERRETERIA","PERFUMERIA","LIQ. 5 LITROS","ESCOBAS","FIBRAS",
  "LIQ. 1 LITRO","JARCERIA","PASTILLA/AROMA","PAPEL","VENENO","DESPACHADORES",
  "LIQ. 500 ML","TRAPADORES BG","DULCERIA"
];

export default function EditProductPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [sidebarWidth, setSidebarWidth] = useState("64px");

  const [sku, setSku] = useState("");
  const [form, setForm] = useState<Pick<Product, "nombre"|"categoria"|"precio">>({
    nombre: "",
    categoria: "",
    precio: 0,
  });
  const [baseStock, setBaseStock] = useState(0);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Carga inicial leyendo ?sku=...
  useEffect(() => {
    const qsSku = (search.get("sku") || "").trim();
    setSku(qsSku);

    if (!qsSku) { setLoading(false); return; }

    (async () => {
      try {
        const [pRes, mRes] = await Promise.all([
          fetch(`/api/products/${encodeURIComponent(qsSku)}`, { cache: "no-store" }),
          fetch("/api/movements", { cache: "no-store" }),
        ]);

        const mjson = await mRes.json();
        setMovements(mjson.movements ?? []);

        if (!pRes.ok) {
          // SKU NO EXISTE → modo “crear”
          setNotFound(true);
          setBaseStock(0);
          setForm({ nombre: "", categoria: "", precio: 0 });
        } else {
          const prod: Product = await pRes.json();
          setNotFound(false);
          setBaseStock(prod.stock);
          setForm({ nombre: prod.nombre, categoria: prod.categoria, precio: prod.precio });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [search]);

  // Delta de movimientos para el SKU
  const delta = useMemo(() => {
    if (!sku) return 0;
    return movements
      .filter(m => m.sku === sku)
      .reduce((acc, m) => acc + (m.movement === "Stock In" ? Number(m.quantity||0) : -Number(m.quantity||0)), 0);
  }, [movements, sku]);

  const effectiveStock = baseStock + delta; // mostrado solo lectura

  const handleChange = (k: keyof typeof form, v: string) => {
    setForm(prev => ({
      ...prev,
      [k]: k === "precio" ? Number(v) : v
    }));
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!sku) { alert("Falta el SKU en la URL (?sku=...)"); return; }
    setSaving(true);
    try {
      // Importante: NO enviamos "stock" (se ajusta solo por Movements)
      const res = await fetch(`/api/products/${encodeURIComponent(sku)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          categoria: form.categoria,
          precio: form.precio,
        }),
      });
      if (!res.ok) throw new Error();
      router.push("/products");
    } catch {
      alert("No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const goAdjustStock = () => {
    if (!sku) return;
    router.push(`/movements/new?sku=${encodeURIComponent(sku)}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen" style={{ margin:0, padding:0 }}>
        <Sidebar onWidthChange={setSidebarWidth} />
        <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
          <Header />
          <div className="p-4">Loading...</div>
        </div>
      </div>
    );
  }

  if (!sku) {
    return (
      <div className="flex h-screen" style={{ margin:0, padding:0 }}>
        <Sidebar onWidthChange={setSidebarWidth} />
        <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
          <Header />
          <div className="p-4">
            <h1 className="text-2xl mb-4 font-bold text-[#1F2937]">Edit Product</h1>
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              Falta el parámetro <strong>sku</strong> en la URL.  
              Abre esta página como: <code className="px-1 bg-gray-100 rounded">/products/edit?sku=BOL-012</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ margin: 0, padding: 0 }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-4 bg-[#f5f5f5] min-h-screen">
          <h1 className="text-2xl mb-4 font-bold text-[#1F2937]">Edit Product</h1>

          {notFound && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
              El SKU <strong>{sku}</strong> no existe. Completa los campos y guarda para crearlo (el stock se ajusta solo vía Movements).
            </div>
          )}

          <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 border max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input value={sku} disabled className="w-full border rounded p-2 bg-gray-100 text-gray-700" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  value={form.nombre}
                  onChange={e => handleChange("nombre", e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none border-gray-300"
                  placeholder="Nombre del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={e => handleChange("categoria", e.target.value)}
                  className="w-full border rounded p-2 bg-white border-gray-300"
                >
                  <option value="">Selecciona categoría</option>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* STOCK SOLO LECTURA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock (efectivo)</label>
                <input
                  value={String(effectiveStock)}
                  disabled
                  className="w-full border rounded p-2 bg-gray-100 text-gray-700"
                />
                <button
                  type="button"
                  onClick={goAdjustStock}
                  className="mt-2 inline-flex items-center px-3 py-2 rounded bg-[#3F54CE] text-white hover:bg-blue-600"
                >
                  Adjust stock
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  El stock se ajusta solo desde Movements. Este valor incluye entradas/salidas.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                <input
                  type="number"
                  min={0}
                  value={form.precio}
                  onChange={e => handleChange("precio", e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none border-gray-300"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button disabled={saving} type="submit" className="bg-[#3F54CE] text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-60">
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={() => router.push("/products")} className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              *El stock base se mantiene en el JSON. Las entradas/salidas se registran en Movements.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
