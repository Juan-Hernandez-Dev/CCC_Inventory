"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

const CATEGORY_OPTIONS = [
  "BOLSAS","FERRETERIA","PERFUMERIA","LIQ. 5 LITROS","ESCOBAS","FIBRAS",
  "LIQ. 1 LITRO","JARCERIA","PASTILLA/AROMA","PAPEL","VENENO","DESPACHADORES",
  "LIQ. 500 ML","TRAPADORES BG","DULCERIA",
];

export default function NewProductPage() {
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = useState("64px");

  const [form, setForm] = useState({
    sku: "",
    nombre: "",
    categoria: "",
    precio: 0,
  });
  const [errors, setErrors] = useState<{[k:string]: string}>({});
  const [saving, setSaving] = useState(false);

  const handle = (k: keyof typeof form, v: string) => {
    setForm(prev => ({
      ...prev,
      [k]: k === "precio" ? Number(v) : v,
    }));
  };

  const validate = () => {
    const e: {[k:string]: string} = {};
    if (!form.sku.trim()) e.sku = "SKU requerido";
    if (!form.nombre.trim()) e.nombre = "Nombre requerido";
    if (!form.categoria.trim()) e.categoria = "Categoría requerida";
    if (!Number.isFinite(form.precio) || form.precio < 0) e.precio = "Precio inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      // ⚠️ Creamos el producto sin stock (la API lo fija a 0)
      const res = await fetch(`/api/products/${encodeURIComponent(form.sku)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          categoria: form.categoria,
          precio: form.precio,
          // 👇 No enviamos 'stock'
        }),
      });
      if (!res.ok) throw new Error();

      // Tras crearlo, te llevo directo a crear su primer movimiento
      router.push(`/movements/new?sku=${encodeURIComponent(form.sku)}`);
    } catch {
      alert("No se pudo crear el producto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen" style={{ margin:0, padding:0 }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-4 bg-[#f5f5f5] min-h-screen">
          <h1 className="text-2xl mb-4 font-bold text-[#1F2937]">Add Product</h1>

          <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 border max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  value={form.sku}
                  onChange={e => handle("sku", e.target.value)}
                  className={`w-full border rounded p-2 focus:outline-none ${errors.sku ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Ej. BOL-012"
                />
                {errors.sku && <p className="text-sm text-red-600 mt-1">{errors.sku}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  value={form.nombre}
                  onChange={e => handle("nombre", e.target.value)}
                  className={`w-full border rounded p-2 focus:outline-none ${errors.nombre ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Nombre del producto"
                />
                {errors.nombre && <p className="text-sm text-red-600 mt-1">{errors.nombre}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={e => handle("categoria", e.target.value)}
                  className={`w-full border rounded p-2 bg-white ${errors.categoria ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Selecciona categoría</option>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.categoria && <p className="text-sm text-red-600 mt-1">{errors.categoria}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                <input
                  type="number" min={0}
                  value={form.precio}
                  onChange={e => handle("precio", e.target.value)}
                  className={`w-full border rounded p-2 focus:outline-none ${errors.precio ? "border-red-500" : "border-gray-300"}`}
                  placeholder="0.00"
                />
                {errors.precio && <p className="text-sm text-red-600 mt-1">{errors.precio}</p>}
              </div>

              {/* SIN campo de Stock, por diseño */}
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
              *El stock inicial siempre es 0. Para agregar existencias, usa <strong>Movements</strong>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
