"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../../components/Header";
import Sidebar from "../../../../components/Sidebar";

// Categorías idénticas a Products
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
};

export default function NewProductPage() {
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = useState("64px");

  const [form, setForm] = useState<NewProduct>({
    sku: "",
    nombre: "",
    categoria: "",
    stock: 0,
  });
  const [errors, setErrors] = useState<{[k:string]: string}>({});

  const handleChange = (k: keyof NewProduct, v: string) => {
    setForm(prev => ({
      ...prev,
      [k]: k === "stock" ? Number(v) : v
    }));
  };

  const validate = (): boolean => {
    const e: {[k:string]: string} = {};
    if (!form.sku.trim()) e.sku = "SKU requerido";
    if (!form.nombre.trim()) e.nombre = "Nombre requerido";
    if (!form.categoria) e.categoria = "Selecciona una categoría";
    if (Number.isNaN(form.stock) || form.stock < 0) e.stock = "Stock debe ser 0 o mayor";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveProduct = () => {
    try {
      const raw = localStorage.getItem("userProducts");
      const list: NewProduct[] = raw ? JSON.parse(raw) : [];
      // Si ya existe el SKU, sobreescribe (update)
      const idx = list.findIndex(p => p.sku === form.sku);
      if (idx >= 0) list[idx] = form;
      else list.push(form);
      localStorage.setItem("userProducts", JSON.stringify(list));
    } catch (err) {
      console.error("Error saving product:", err);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    saveProduct();
    router.push("/products"); // regresa a la lista
  };

  return (
    <div className="flex h-screen" style={{ margin: 0, padding: 0 }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-4 bg-[#f5f5f5] min-h-screen">
          <h1 className="text-2xl mb-4 font-bold text-[#1F2937]">Add Product</h1>

          <form
            onSubmit={onSubmit}
            className="bg-white rounded-xl shadow p-6 border max-w-3xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  className={`w-full border rounded p-2 focus:outline-none ${errors.sku ? "border-red-500" : "border-gray-300"}`}
                  placeholder="e.g. BOL-012"
                />
                {errors.sku && <p className="text-sm text-red-600 mt-1">{errors.sku}</p>}
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => handleChange("nombre", e.target.value)}
                  className={`w-full border rounded p-2 focus:outline-none ${errors.nombre ? "border-red-500" : "border-gray-300"}`}
                  placeholder="Nombre del producto"
                />
                {errors.nombre && <p className="text-sm text-red-600 mt-1">{errors.nombre}</p>}
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={form.categoria}
                  onChange={(e) => handleChange("categoria", e.target.value)}
                  className={`w-full border rounded p-2 bg-white ${errors.categoria ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Selecciona categoría</option>
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {errors.categoria && <p className="text-sm text-red-600 mt-1">{errors.categoria}</p>}
              </div>

              {/* Stock base */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                <input
                  type="number"
                  min={0}
                  value={Number.isNaN(form.stock) ? "" : form.stock}
                  onChange={(e) => handleChange("stock", e.target.value)}
                  className={`w-full border rounded p-2 focus:outline-none ${errors.stock ? "border-red-500" : "border-gray-300"}`}
                  placeholder="0"
                />
                {errors.stock && <p className="text-sm text-red-600 mt-1">{errors.stock}</p>}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="submit"
                className="bg-[#3F54CE] text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Save
              </button>

              <button
                type="button"
                onClick={() => router.push("/products")}
                className="px-4 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Nota visual */}
            <p className="text-xs text-gray-500 mt-4">
              *Este formulario es local, hay que generar o bien conectar la base de datos
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
