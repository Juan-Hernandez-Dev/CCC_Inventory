// Le decimos a Next.js que este es un "Componente de Cliente",
// lo que significa que se ejecuta en el navegador del usuario y puede ser interactivo.
"use client";

// Importamos las herramientas que necesitamos de React y Next.js, y nuestros componentes.
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

// Definimos la "forma" de nuestros datos para que el código sea más claro y seguro.
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
  stock: number;   // Este es el stock "base" guardado, no se puede editar aquí.
  precio: number;
};

// Una lista fija con todas las categorías de productos disponibles.
const CATEGORY_OPTIONS = [
  "BOLSAS", "FERRETERIA", "PERFUMERIA", "LIQ. 5 LITROS", "ESCOBAS", "FIBRAS",
  "LIQ. 1 LITRO", "JARCERIA", "PASTILLA/AROMA", "PAPEL", "VENENO", "DESPACHADORES",
  "LIQ. 500 ML", "TRAPADORES BG", "DULCERIA"
];

// Este es el componente de la página para editar o crear un producto.
export default function EditProductPage() {
  // Hooks de Next.js para manejar la navegación y leer parámetros de la URL.
  const router = useRouter();
  const search = useSearchParams(); // Para leer el ?sku=... de la URL.
  // Estado para el ancho de la barra lateral.
  const [sidebarWidth, setSidebarWidth] = useState("64px");

  // --- Estados del Componente ---
  const [sku, setSku] = useState(""); // El SKU del producto, leído de la URL.
  // Los datos del formulario que el usuario puede editar.
  const [form, setForm] = useState<Pick<Product, "nombre" | "categoria" | "precio">>({
    nombre: "",
    categoria: "",
    precio: 0,
  });
  const [baseStock, setBaseStock] = useState(0); // El stock guardado en la base de datos (solo lectura).
  const [movements, setMovements] = useState<Movement[]>([]); // Lista de todos los movimientos de stock.
  const [loading, setLoading] = useState(true); // Para mostrar un mensaje mientras se cargan los datos.
  const [saving, setSaving] = useState(false); // Para desactivar el botón mientras se guarda.
  const [notFound, setNotFound] = useState(false); // Para saber si el SKU es nuevo o ya existe.

  // Efecto que se ejecuta al cargar la página para obtener los datos.
  useEffect(() => {
    // Leemos el SKU que viene en la URL.
    const qsSku = (search.get("sku") || "").trim();
    setSku(qsSku);

    // Si no hay SKU en la URL, no hay nada que cargar.
    if (!qsSku) { setLoading(false); return; }

    // Función asíncrona para cargar los datos desde la API.
    (async () => {
      try {
        // Pedimos los datos del producto y la lista de todos los movimientos al mismo tiempo.
        const [pRes, mRes] = await Promise.all([
          fetch(`/api/products/${encodeURIComponent(qsSku)}`),
          fetch("/api/movements"),
        ]);

        // Guardamos la lista de movimientos.
        const mjson = await mRes.json();
        setMovements(mjson.movements ?? []);

        // Si la API no encontró el producto (devuelve un error)...
        if (!pRes.ok) {
          // ...activamos el modo "crear". El producto es nuevo.
          setNotFound(true);
          setBaseStock(0); // El stock base de un producto nuevo es 0.
          setForm({ nombre: "", categoria: "", precio: 0 }); // El formulario empieza vacío.
        } else {
          // Si el producto SÍ se encontró, rellenamos el formulario con sus datos.
          const prod: Product = await pRes.json();
          setNotFound(false);
          setBaseStock(prod.stock);
          setForm({ nombre: prod.nombre, categoria: prod.categoria, precio: prod.precio });
        }
      } finally {
        // Al final de todo (con éxito o error), dejamos de mostrar "Cargando...".
        setLoading(false);
      }
    })();
  }, [search]); // Este efecto se ejecuta cada vez que cambia la URL.

  // Calcula el cambio total en el stock (entradas - salidas) para este producto.
  // `useMemo` optimiza esto para que solo se recalcule si cambian los movimientos o el SKU.
  const delta = useMemo(() => {
    if (!sku) return 0;
    return movements
      .filter(m => m.sku === sku)
      .reduce((acc, m) => acc + (m.movement === "Stock In" ? Number(m.quantity || 0) : -Number(m.quantity || 0)), 0);
  }, [movements, sku]);

  // El stock real que ve el usuario. Es la suma del stock base + todos los movimientos.
  const effectiveStock = baseStock + delta;

  // Función que actualiza el formulario cuando el usuario escribe en un campo.
  const handleChange = (k: keyof typeof form, v: string) => {
    setForm(prev => ({
      ...prev,
      [k]: k === "precio" ? Number(v) : v
    }));
  };

  // Función que se ejecuta al enviar el formulario para guardar los cambios.
  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault(); // Evita que la página se recargue.
    if (!sku) { alert("Falta el SKU en la URL (?sku=...)"); return; }

    setSaving(true); // Desactivamos el botón de guardar.
    try {
      // Importante: NO enviamos el campo "stock". Este se ajusta solo a través de los Movimientos.
      const res = await fetch(`/api/products/${encodeURIComponent(sku)}`, {
        method: "PUT", // Usamos PUT para crear o actualizar.
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          categoria: form.categoria,
          precio: form.precio,
        }),
      });
      if (!res.ok) throw new Error(); // Si la API da error, lo lanzamos.

      // Si todo sale bien, volvemos a la lista de productos.
      router.push("/products");
    } catch {
      alert("No se pudo guardar el producto.");
    } finally {
      setSaving(false); // Al final, reactivamos el botón.
    }
  };

  // Función para ir a la página de "Crear Movimiento" para este producto.
  const goAdjustStock = () => {
    if (!sku) return;
    router.push(`/movements/new?sku=${encodeURIComponent(sku)}`);
  };

  // --- Renderizado Condicional ---

  // Mientras se cargan los datos, mostramos un mensaje simple.
  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar onWidthChange={setSidebarWidth} />
        <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
          <Header />
          <div className="p-4">Cargando...</div>
        </div>
      </div>
    );
  }

  // Si no hay SKU en la URL, mostramos un mensaje de error.
  if (!sku) {
    return (
      <div className="flex h-screen">
        <Sidebar onWidthChange={setSidebarWidth} />
        <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
          <Header />
          <div className="p-4">
            <h1 className="text-2xl mb-4 font-bold">Editar Producto</h1>
            <div className="bg-yellow-50 p-3 rounded">
              Falta el parámetro <strong>sku</strong> en la URL.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Renderizado Principal (la página con el formulario) ---
  return (
    <div className="flex h-screen">
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-4 bg-[#f5f5f5] min-h-screen">
          <h1 className="text-2xl mb-4 font-bold">Editar Producto</h1>

          {/* Si el producto es nuevo, mostramos una alerta informativa. */}
          {notFound && (
            <div className="mb-4 bg-yellow-50 p-3 rounded">
              El SKU <strong>{sku}</strong> no existe. Rellena los campos y guarda para crearlo.
            </div>
          )}

          {/* Formulario para editar/crear el producto */}
          <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campo SKU (solo lectura) */}
              <div>
                <label>SKU</label>
                <input value={sku} disabled className="w-full border rounded p-2 bg-gray-100" />
              </div>

              {/* Campo Nombre */}
              <div>
                <label>Nombre</label>
                <input
                  value={form.nombre}
                  onChange={e => handleChange("nombre", e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder="Nombre del producto"
                />
              </div>

              {/* Selector de Categoría */}
              <div>
                <label>Categoría</label>
                <select
                  value={form.categoria}
                  onChange={e => handleChange("categoria", e.target.value)}
                  className="w-full border rounded p-2 bg-white"
                >
                  <option value="">Selecciona categoría</option>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Campo de Stock (solo lectura) */}
              <div>
                <label>Stock (efectivo)</label>
                <input value={String(effectiveStock)} disabled className="w-full border rounded p-2 bg-gray-100" />
                <button type="button" onClick={goAdjustStock} className="mt-2 px-3 py-2 rounded bg-[#3F54CE] text-white">
                  Ajustar stock
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  El stock se ajusta solo desde Movimientos.
                </p>
              </div>

              {/* Campo de Precio */}
              <div>
                <label>Precio</label>
                <input
                  type="number" min={0}
                  value={form.precio}
                  onChange={e => handleChange("precio", e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="mt-6 flex items-center gap-3">
              <button disabled={saving} type="submit" className="bg-[#3F54CE] text-white px-4 py-2 rounded">
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button type="button" onClick={() => router.push("/products")} className="px-4 py-2 rounded border">
                Cancelar
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              *El stock base se guarda aparte. Las entradas/salidas se registran como Movimientos.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}