"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../../components/Header";
import Sidebar from "../../../../components/Sidebar";

const CATEGORY_OPTIONS = [
  "BOLSAS","FERRETERIA","PERFUMERIA","LIQ. 5 LITROS","ESCOBAS","FIBRAS",
  "LIQ. 1 LITRO","JARCERIA","PASTILLA/AROMA","PAPEL","VENENO","DESPACHADORES",
  "LIQ. 500 ML","TRAPADORES BG","DULCERIA"
];

type NewProduct = {
  sku: string;
  nombre: string;
  categoria: string;
  stock: number;
  precio: number;
};

export default function NewProductPage() {
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = useState("64px");

  const [form, setForm] = useState<NewProduct>({ sku: "", nombre: "", categoria: "", stock: 0, precio: 0 });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [saving, setSaving] = useState(false);

  const handleChange = (k: keyof NewProduct, v: string) => {
    setForm((prev) => ({ ...prev, [k]: k === "stock" || k === "precio" ? (v === "" ? 0 : Number(v)) : v }));
  };

  const validate = (): boolean => {
    const e: { [k: string]: string } = {};
    if (!form.sku.trim()) e.sku = "SKU requerido";
    if (!form.nombre.trim()) e.nombre = "Nombre requerido";
    if (!form.categoria) e.categoria = "Selecciona una categoría";
    if (Number.isNaN(form.stock) || form.stock < 0) e.stock = "Stock debe ser 0 o mayor";
    if (Number.isNaN(form.precio) || form.precio < 0) e.precio = "Precio debe ser 0 o mayor";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      // 1) Crear producto
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("No se pudo guardar el producto");

      // 2) Si hay stock inicial, registrar movement "Stock In"
      if (form.stock > 0) {
        await fetch("/api/movements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: form.nombre,
            sku: form.sku,
            movement: "Stock In",
            quantity: form.stock,
            user: "System",
          }),
        });
      }

      router.push("/products");
    } catch (err) {
      alert("No se pudo guardar.");
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
          <h1 className="text-2xl mb-4 font-bold text-[#1F2937]">Add Product</h1>

          <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 border max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text" value={form.sku} onChange={(e) => handleChange("sku", e.target.value)}
                  className={`w-full border rounded p-2 focus:outline-none ${errors.sku ? "border-red-500" : "border-gray-300"}`} placeholder="e.g. BOL-012"
                />
                {errors.sku && <p className="text-sm text-red-600 mt-1">{errors.sku}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text" value={form.nombre} onChange={(e) => handleChange("nombre", e.target.value)}
                  className={`w-full border rounded p-2 focus:outline-none ${errors.nombre ? "border-red-500" : "border-gray-300"}`} placeholder="Nombre del producto"
                />
                {errors.nombre && <p className="text-sm text-red-600 mt-1">{errors.nombre}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={form.categoria} onChange={(e) => handleChange("categoria", e.target.value)}
                  className={`w-full border rounded p-2 bg-white ${errors.categoria ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Selecciona categoría</option>
                  {CATEGORY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {errors.categoria && <p className="text-sm text-red-600 mt-1">{errors.categoria}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number" min={0} value={form.stock ?? 0} onChange={(e) => handleChange("stock", e.target.value)}
                  className={`w-full border rounded p-2 focus:outline-none ${errors.stock ? "border-red-500" : "border-gray-300"}`} placeholder="0"
                />
                {errors.stock && <p className="text-sm text-red-600 mt-1">{errors.stock}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                <input
                  type="number" min={0} value={form.precio ?? 0} onChange={(e) => handleChange("precio", e.target.value)}
                  className={`w-full border rounded p-2 focus:outline-none ${errors.precio ? "border-red-500" : "border-gray-300"}`} placeholder="0"
                />
                {errors.precio && <p className="text-sm text-red-600 mt-1">{errors.precio}</p>}
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
              *Se guarda en <code>data/productos.json</code> y se registra movimiento si el stock inicial &gt; 0.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
