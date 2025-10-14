// Le decimos a Next.js que este es un "Componente de Cliente".
// Se ejecuta en el navegador y puede usar estado (useState) y efectos (useEffect).
"use client";

// Importamos las herramientas que necesitamos de React y Next.js.
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// Importamos nuestros componentes de la interfaz.
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

// Definimos los tipos de datos que vamos a manejar.
type MovementType = "Stock In" | "Stock Out";
type Product = { sku: string; nombre: string; categoria: string };

// Una lista fija con todas las categorías de productos disponibles.
const CATEGORY_OPTIONS = [
  "BOLSAS", "FERRETERIA", "PERFUMERIA", "LIQ. 5 LITROS", "ESCOBAS", "FIBRAS",
  "LIQ. 1 LITRO", "JARCERIA", "PASTILLA/AROMA", "PAPEL", "VENENO", "DESPACHADORES",
  "LIQ. 500 ML", "TRAPADORES BG", "DULCERIA"
];

// Este es el componente de la página para crear un nuevo movimiento de inventario.
export default function NewMovementPage() {
  // Hooks de Next.js para navegar y leer parámetros de la URL.
  const router = useRouter();
  const search = useSearchParams(); // Para leer cosas como ?sku=...
  // Estado para el ancho de la barra lateral.
  const [sidebarWidth, setSidebarWidth] = useState("64px");

  // Estados para manejar los datos de la página.
  const [catalog, setCatalog] = useState<Product[]>([]); // Guarda la lista de todos los productos.
  const [category, setCategory] = useState<string>(""); // Guarda la categoría seleccionada para filtrar.
  // Guarda los datos del formulario que el usuario está llenando.
  const [form, setForm] = useState({
    sku: "",
    product: "",
    movement: "Stock In" as MovementType,
    quantity: 0,
    user: "System",
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({}); // Para guardar los errores de validación.
  const [saving, setSaving] = useState(false); // Para saber si se está guardando y deshabilitar el botón.

  // --- EFECTOS ---

  // Efecto para cargar el catálogo de productos cuando la página carga.
  useEffect(() => {
    (async () => {
      // Pedimos la lista de productos a nuestra API.
      const res = await fetch("/api/products", { cache: "no-store" });
      const json = await res.json();
      // Guardamos la lista en el estado 'catalog'.
      setCatalog(json.productos ?? []);
    })();
  }, []); // El array vacío `[]` significa que solo se ejecuta una vez.

  // Efecto para pre-seleccionar un producto si viene un SKU en la URL.
  useEffect(() => {
    // Leemos el SKU de la URL (ej: /movements/new?sku=ABC-123).
    const qsSku = (search.get("sku") || "").trim();
    // Si no hay SKU en la URL o el catálogo aún no carga, no hacemos nada.
    if (!qsSku || catalog.length === 0) return;
    // Buscamos el producto en nuestro catálogo.
    const prod = catalog.find(p => p.sku === qsSku);
    // Si lo encontramos, actualizamos el formulario con sus datos.
    if (prod) {
      setCategory(prod.categoria);
      setForm(f => ({ ...f, sku: prod.sku, product: prod.nombre }));
    }
  }, [search, catalog]); // Se ejecuta si cambia el SKU de la URL o si carga el catálogo.

  // --- VALORES MEMOIZADOS (para optimizar) ---

  // Filtra la lista de productos según la categoría seleccionada.
  // `useMemo` hace que no se vuelva a calcular si `catalog` o `category` no han cambiado.
  const filteredByCategory = useMemo(
    () => (category ? catalog.filter(p => p.categoria === category) : catalog),
    [catalog, category]
  );

  // Crea un mapa para buscar rápidamente el nombre de un producto a partir de su SKU.
  // Es más eficiente que buscar en el array cada vez.
  const skuToName = useMemo(() => {
    const m = new Map<string, string>();
    catalog.forEach(p => m.set(p.sku, p.nombre));
    return m;
  }, [catalog]);

  // --- MANEJADORES DE EVENTOS ---

  // Función genérica para actualizar cualquier campo del formulario.
  const handleChange = (k: keyof typeof form, v: string) => {
    setForm(prev => ({
      ...prev,
      // Si el campo es 'quantity', lo convierte a número.
      [k]: k === "quantity" ? (v === "" ? 0 : Number(v)) : (v as any),
    }));
  };

  // Función especial para cuando cambia el SKU seleccionado.
  const onSkuChange = (v: string) => {
    // Busca el nombre del producto usando el mapa que creamos antes.
    const name = skuToName.get(v) ?? "";
    // Actualiza tanto el SKU como el nombre del producto en el formulario.
    setForm(prev => ({ ...prev, sku: v, product: name }));
  };

  // --- LÓGICA DE VALIDACIÓN Y ENVÍO ---

  // Valida que todos los campos requeridos del formulario estén llenos y correctos.
  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!form.sku.trim()) e.sku = "SKU requerido";
    if (!form.product.trim()) e.product = "Nombre requerido";
    if (!form.movement) e.movement = "Movimiento requerido";
    if (form.quantity <= 0) e.quantity = "Cantidad inválida";
    // Guarda los errores en el estado para mostrarlos en la interfaz.
    setErrors(e);
    // Devuelve `true` si no hay errores.
    return Object.keys(e).length === 0;
  };

  // Se ejecuta cuando el usuario envía el formulario.
  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault(); // Evita que la página se recargue.
    if (!validate()) return; // Si la validación falla, no continuamos.
    setSaving(true); // Deshabilitamos el botón de guardar.

    try {
      // Enviamos los datos del formulario a la API para crear el movimiento.
      const res = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(); // Si hay un error, lo lanzamos.
      // Si todo sale bien, volvemos a la lista de movimientos.
      router.push("/movements");
    } catch {
      alert("No se pudo crear el movimiento.");
    } finally {
      setSaving(false); // Volvemos a habilitar el botón.
    }
  };

  // --- RENDERIZADO DEL COMPONENTE (JSX) ---
  return (
    // Estructura principal de la página.
    <div className="flex h-screen">
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-4 bg-[#f5f5f5] min-h-screen">
          <h1 className="text-2xl mb-4 font-bold">Agregar Movimiento</h1>

          {/* El formulario para crear el nuevo movimiento. */}
          <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 max-w-3xl">
            {/* Contenedor de los campos del formulario. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Selector para filtrar productos por categoría. */}
              <div>
                <label>Categoría</label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setForm(f => ({ ...f, sku: "", product: "" })); }}
                  className="w-full border rounded p-2"
                >
                  <option value="">Todas</option>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Selector para elegir el SKU del producto. */}
              <div>
                <label>SKU</label>
                <select
                  value={form.sku}
                  onChange={(e) => onSkuChange(e.target.value)}
                  className={`w-full border rounded p-2 ${errors.sku ? "border-red-500" : ""}`}
                >
                  <option value="">Selecciona un SKU</option>
                  {/* Muestra los productos filtrados por categoría. */}
                  {filteredByCategory.map(p => (
                    <option key={p.sku} value={p.sku}>{p.sku} — {p.nombre}</option>
                  ))}
                </select>
                {/* Muestra el mensaje de error si existe. */}
                {errors.sku && <p className="text-sm text-red-600 mt-1">{errors.sku}</p>}
              </div>

              {/* Campo para el nombre del producto (se llena automáticamente). */}
              <div>
                <label>Producto</label>
                <input
                  value={form.product}
                  onChange={e => handleChange("product", e.target.value)}
                  className={`w-full border rounded p-2 ${errors.product ? "border-red-500" : ""}`}
                  placeholder="Nombre del producto"
                />
                {errors.product && <p className="text-sm text-red-600 mt-1">{errors.product}</p>}
              </div>

              {/* Selector para el tipo de movimiento (entrada/salida). */}
              <div>
                <label>Movimiento</label>
                <select
                  value={form.movement}
                  onChange={e => handleChange("movement", e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="Stock In">Stock In</option>
                  <option value="Stock Out">Stock Out</option>
                </select>
              </div>

              {/* Campo para la cantidad. */}
              <div>
                <label>Cantidad</label>
                <input
                  type="number" min={1}
                  value={form.quantity}
                  onChange={e => handleChange("quantity", e.target.value)}
                  className={`w-full border rounded p-2 ${errors.quantity ? "border-red-500" : ""}`}
                />
                {errors.quantity && <p className="text-sm text-red-600 mt-1">{errors.quantity}</p>}
              </div>

              {/* Campo para el usuario. */}
              <div>
                <label>Usuario</label>
                <input
                  value={form.user}
                  onChange={e => handleChange("user", e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>
            </div>

            {/* Botones de acción. */}
            <div className="mt-6 flex items-center gap-3">
              <button disabled={saving} type="submit" className="bg-[#3F54CE] text-white px-4 py-2 rounded">
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button type="button" onClick={() => router.push("/movements")} className="px-4 py-2 rounded border">
                Cancelar
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              *La fecha se guarda automáticamente.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}