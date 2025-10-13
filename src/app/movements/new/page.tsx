"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

type MovementType = "Stock In" | "Stock Out";
type Product = { sku: string; nombre: string; categoria: string };

const CATEGORY_OPTIONS = [
  "BOLSAS","FERRETERIA","PERFUMERIA","LIQ. 5 LITROS","ESCOBAS","FIBRAS",
  "LIQ. 1 LITRO","JARCERIA","PASTILLA/AROMA","PAPEL","VENENO","DESPACHADORES",
  "LIQ. 500 ML","TRAPADORES BG","DULCERIA"
];

export default function NewMovementPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [sidebarWidth, setSidebarWidth] = useState("64px");

  const [catalog, setCatalog] = useState<Product[]>([]);
  const [category, setCategory] = useState<string>("");
  const [form, setForm] = useState({
    sku: "",
    product: "",
    movement: "Stock In" as MovementType,
    quantity: 0,
    user: "System",
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [saving, setSaving] = useState(false);

  // Cargar catálogo
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/products", { cache: "no-store" });
      const json = await res.json();
      setCatalog(json.productos ?? []);
    })();
  }, []);

  // Si viene ?sku=..., preseleccionarlo
  useEffect(() => {
    const qsSku = (search.get("sku") || "").trim();
    if (!qsSku || catalog.length === 0) return;
    const prod = catalog.find(p => p.sku === qsSku);
    if (prod) {
      setCategory(prod.categoria);
      setForm(f => ({ ...f, sku: prod.sku, product: prod.nombre }));
    }
  }, [search, catalog]);

  const filteredByCategory = useMemo(
    () => (category ? catalog.filter(p => p.categoria === category) : catalog),
    [catalog, category]
  );

  const skuToName = useMemo(() => {
    const m = new Map<string, string>();
    catalog.forEach(p => m.set(p.sku, p.nombre));
    return m;
  }, [catalog]);

  const handleChange = (k: keyof typeof form, v: string) => {
    setForm(prev => ({
      ...prev,
      [k]: k === "quantity" ? (v === "" ? 0 : Number(v)) : (v as any),
    }));
  };

  const onSkuChange = (v: string) => {
    const name = skuToName.get(v) ?? "";
    setForm(prev => ({ ...prev, sku: v, product: name }));
  };

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!form.sku.trim()) e.sku = "SKU requerido";
    if (!form.product.trim()) e.product = "Nombre requerido";
    if (!form.movement) e.movement = "Movimiento requerido";
    if (!Number.isFinite(form.quantity) || form.quantity <= 0) e.quantity = "Cantidad inválida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      router.push("/movements");
    } catch {
      alert("No se pudo crear el movimiento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen" style={{ margin: 0, padding: 0 }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-4 bg-[#f5f5f5] min-h-screen">
          <h1 className="text-2xl mb-4 font-bold text-[#1F2937]">Add Movement</h1>

          <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 border max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setForm(f => ({ ...f, sku: "", product: "" })); }}
                  className="w-full border rounded p-2 bg-white border-gray-300"
                >
                  <option value="">Todas</option>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <select
                  value={form.sku}
                  onChange={(e) => onSkuChange(e.target.value)}
                  className={`w-full border rounded p-2 bg-white ${errors.sku ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Selecciona un SKU</option>
                  {filteredByCategory.map(p => (
                    <option key={p.sku} value={p.sku}>{p.sku} — {p.nombre}</option>
                  ))}
                </select>
                {errors.sku && <p className="text-sm text-red-600 mt-1">{errors.sku}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <input
                  value={form.product}
                  onChange={e => handleChange("product", e.target.value)}
                  className={`w-full border rounded p-2 focus:outline-none ${errors.product ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Nombre del producto"
                />
                {errors.product && <p className="text-sm text-red-600 mt-1">{errors.product}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Movimiento</label>
                <select
                  value={form.movement}
                  onChange={e => handleChange("movement", e.target.value)}
                  className="w-full border rounded p-2 bg-white border-gray-300"
                >
                  <option value="Stock In">Stock In</option>
                  <option value="Stock Out">Stock Out</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input
                  type="number" min={1}
                  value={form.quantity}
                  onChange={e => handleChange("quantity", e.target.value)}
                  className={`w-full border rounded p-2 focus:outline-none ${errors.quantity ? "border-red-500" : "border-gray-300"}`}
                />
                {errors.quantity && <p className="text-sm text-red-600 mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input
                  value={form.user}
                  onChange={e => handleChange("user", e.target.value)}
                  className="w-full border rounded p-2 focus:outline-none border-gray-300"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button disabled={saving} type="submit" className="bg-[#3F54CE] text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-60">
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" onClick={() => router.push("/movements")} className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              *La fecha se guarda automáticamente (hora del servidor).
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
