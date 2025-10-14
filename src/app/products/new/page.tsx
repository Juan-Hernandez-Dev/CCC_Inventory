// Le decimos a Next.js que este componente se ejecuta en el navegador,
// lo que nos permite usar estado (useState) y otras funciones interactivas.
"use client";

// Importamos las herramientas necesarias de React y Next.js, y nuestros componentes.
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

// Una lista fija de todas las categorías de productos disponibles.
const CATEGORY_OPTIONS = [
  "BOLSAS", "FERRETERIA", "PERFUMERIA", "LIQ. 5 LITROS", "ESCOBAS", "FIBRAS",
  "LIQ. 1 LITRO", "JARCERIA", "PASTILLA/AROMA", "PAPEL", "VENENO", "DESPACHADORES",
  "LIQ. 500 ML", "TRAPADORES BG", "DULCERIA",
];

// Este es el componente principal de la página para añadir un nuevo producto.
export default function NewProductPage() {
  // Hook de Next.js para poder navegar a otras páginas.
  const router = useRouter();
  // Estado para controlar el ancho de la barra lateral.
  const [sidebarWidth, setSidebarWidth] = useState("64px");

  // Estado para guardar los datos que el usuario introduce en el formulario.
  const [form, setForm] = useState({
    sku: "",
    nombre: "",
    categoria: "",
    precio: 0,
  });
  // Estado para guardar los mensajes de error de validación.
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  // Estado para saber si se está guardando y deshabilitar el botón.
  const [saving, setSaving] = useState(false);

  // Función para manejar los cambios en cualquier campo del formulario.
  const handle = (k: keyof typeof form, v: string) => {
    setForm(prev => ({
      ...prev,
      // Si el campo es 'precio', lo convierte a número. Para los demás, es texto.
      [k]: k === "precio" ? Number(v) : v,
    }));
  };

  // Función para validar que los campos del formulario estén correctos.
  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!form.sku.trim()) e.sku = "SKU requerido";
    if (!form.nombre.trim()) e.nombre = "Nombre requerido";
    if (!form.categoria.trim()) e.categoria = "Categoría requerida";
    if (form.precio < 0) e.precio = "Precio inválido";
    // Guarda los errores en el estado para mostrarlos en la pantalla.
    setErrors(e);
    // Devuelve 'true' si no hay errores, y 'false' si hay alguno.
    return Object.keys(e).length === 0;
  };

  // Función que se ejecuta cuando el usuario envía el formulario.
  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault(); // Evita que la página se recargue.
    if (!validate()) return; // Si la validación falla, no hacemos nada más.

    setSaving(true); // Ponemos el estado de "guardando" a true.
    try {
      // Enviamos los datos a la API para crear el producto.
      // Usamos PUT porque nuestra API crea o actualiza con el mismo método.
      // ¡Importante! No enviamos el 'stock', la API lo pondrá en 0 automáticamente.
      const res = await fetch(`/api/products/${encodeURIComponent(form.sku)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          categoria: form.categoria,
          precio: form.precio,
        }),
      });
      // Si la API responde con un error, lo lanzamos para que lo capture el 'catch'.
      if (!res.ok) throw new Error();

      // Si todo sale bien, redirigimos al usuario a la página para crear el primer
      // movimiento de stock para este nuevo producto.
      router.push(`/movements/new?sku=${encodeURIComponent(form.sku)}`);
    } catch {
      // Si algo falla, mostramos una alerta.
      alert("No se pudo crear el producto.");
    } finally {
      // Haya funcionado o no, al final reactivamos el botón de guardar.
      setSaving(false);
    }
  };

  // --- Renderizado de la Página (lo que se ve en pantalla) ---
  return (
    <div className="flex h-screen">
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-4 bg-[#f5f5f5] min-h-screen">
          <h1 className="text-2xl mb-4 font-bold">Añadir Producto</h1>

          {/* Formulario para crear el producto */}
          <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Campo para el SKU */}
              <div>
                <label>SKU</label>
                <input
                  value={form.sku}
                  onChange={e => handle("sku", e.target.value)}
                  className={`w-full border rounded p-2 ${errors.sku ? "border-red-500" : ""}`}
                  placeholder="Ej. BOL-012"
                />
                {/* Muestra el mensaje de error si existe */}
                {errors.sku && <p className="text-sm text-red-600 mt-1">{errors.sku}</p>}
              </div>

              {/* Campo para el Nombre */}
              <div>
                <label>Nombre</label>
                <input
                  value={form.nombre}
                  onChange={e => handle("nombre", e.target.value)}
                  className={`w-full border rounded p-2 ${errors.nombre ? "border-red-500" : ""}`}
                  placeholder="Nombre del producto"
                />
                {errors.nombre && <p className="text-sm text-red-600 mt-1">{errors.nombre}</p>}
              </div>

              {/* Selector de Categoría */}
              <div>
                <label>Categoría</label>
                <select
                  value={form.categoria}
                  onChange={e => handle("categoria", e.target.value)}
                  className={`w-full border rounded p-2 bg-white ${errors.categoria ? "border-red-500" : ""}`}
                >
                  <option value="">Selecciona categoría</option>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.categoria && <p className="text-sm text-red-600 mt-1">{errors.categoria}</p>}
              </div>

              {/* Campo para el Precio */}
              <div>
                <label>Precio</label>
                <input
                  type="number" min={0}
                  value={form.precio}
                  onChange={e => handle("precio", e.target.value)}
                  className={`w-full border rounded p-2 ${errors.precio ? "border-red-500" : ""}`}
                  placeholder="0.00"
                />
                {errors.precio && <p className="text-sm text-red-600 mt-1">{errors.precio}</p>}
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

            {/* Nota informativa */}
            <p className="text-xs text-gray-500 mt-4">
              *El stock inicial siempre es 0. Para agregar existencias, usa <strong>Movimientos</strong>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}