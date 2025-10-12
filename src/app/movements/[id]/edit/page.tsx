"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../../../components/Header";
import Sidebar from "../../../../../components/Sidebar";

type MovementType = "Stock In" | "Stock Out";
type Movement = {
  id: string; date: string; product: string; sku: string;
  movement: MovementType; quantity: number; user: string;
};

export default function EditMovementPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [sidebarWidth, setSidebarWidth] = useState("64px");

  const [form, setForm] = useState<Movement | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/movements/${params.id}`, { cache: "no-store" });
      if (!res.ok) { alert("Movimiento no encontrado"); router.push("/movements"); return; }
      setForm(await res.json());
    })();
  }, [params.id, router]);

  const handleChange = (k: keyof Movement, v: string) => {
    if (!form) return;
    setForm(prev => prev ? ({ ...prev, [k]: k === "quantity" ? Number(v) : v }) : prev);
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/movements/${form.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      router.push("/movements");
    } catch {
      alert("No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return null;

  return (
    <div className="flex h-screen" style={{ margin: 0, padding: 0 }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-4 bg-[#f5f5f5] min-h-screen">
          <h1 className="text-2xl mb-4 font-bold text-[#1F2937]">Edit Movement</h1>
          <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 border max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input value={form.sku} onChange={e => handleChange("sku", e.target.value)} className="w-full border rounded p-2 border-gray-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <input value={form.product} onChange={e => handleChange("product", e.target.value)} className="w-full border rounded p-2 border-gray-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Movimiento</label>
                <select value={form.movement} onChange={e => handleChange("movement", e.target.value)} className="w-full border rounded p-2 bg-white border-gray-300">
                  <option value="Stock In">Stock In</option>
                  <option value="Stock Out">Stock Out</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input type="number" min={1} value={form.quantity} onChange={e => handleChange("quantity", e.target.value)} className="w-full border rounded p-2 border-gray-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input value={form.user} onChange={e => handleChange("user", e.target.value)} className="w-full border rounded p-2 border-gray-300" />
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
          </form>
        </div>
      </div>
    </div>
  );
}
