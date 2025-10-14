// Le indicamos a Next.js que este es un "Componente de Cliente",
// lo que significa que se ejecuta en el navegador del usuario y puede usar hooks como useState y useEffect.
"use client";

// Importamos las herramientas necesarias de React y Next.js.
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// Importamos los componentes de la interfaz, como el encabezado y la barra lateral.
import Header from "../../../../../components/Header";
import Sidebar from "../../../../../components/Sidebar";

// Definimos los tipos de datos que usaremos para un movimiento.
type MovementType = "Stock In" | "Stock Out"; // Un movimiento solo puede ser de entrada o salida.
type Movement = {
  id: string; date: string; product: string; sku: string;
  movement: MovementType; quantity: number; user: string;
};

// Este es el componente principal de la página para editar un movimiento.
export default function EditMovementPage() {
  // Hook de Next.js para manejar la navegación (redireccionar a otras páginas).
  const router = useRouter();
  // Hook para obtener los parámetros de la URL, como el ID del movimiento a editar.
  const params = useParams<{ id: string }>();
  // Estado para controlar el ancho de la barra lateral y ajustar el contenido principal.
  const [sidebarWidth, setSidebarWidth] = useState("64px");

  // Estado para guardar los datos del movimiento que se está editando.
  const [form, setForm] = useState<Movement | null>(null);
  // Estado para saber si se está guardando el formulario (para deshabilitar el botón).
  const [saving, setSaving] = useState(false);

  // Este efecto se ejecuta una vez cuando el componente se carga.
  useEffect(() => {
    // Definimos una función asíncrona para poder usar 'await'.
    (async () => {
      // Hacemos una petición a nuestra API para obtener los datos del movimiento específico.
      const res = await fetch(`/api/movements/${params.id}`);
      // Si la petición falla (ej. el movimiento no existe), avisamos y volvemos a la lista.
      if (!res.ok) {
        alert("Movimiento no encontrado");
        router.push("/movements");
        return;
      }
      // Si todo va bien, guardamos los datos del movimiento en el estado 'form'.
      setForm(await res.json());
    })();
  }, [params.id, router]); // Se volverá a ejecutar si el 'id' o el 'router' cambian.

  // Función para manejar los cambios en cualquier campo del formulario.
  const handleChange = (k: keyof Movement, v: string) => {
    // Si el formulario aún no ha cargado, no hacemos nada.
    if (!form) return;
    // Actualizamos el estado del formulario con el nuevo valor.
    // Si el campo es 'quantity', lo convertimos a número.
    setForm(prev => prev ? ({ ...prev, [k]: k === "quantity" ? Number(v) : v }) : prev);
  };

  // Función que se ejecuta al enviar el formulario.
  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault(); // Evitamos que la página se recargue.
    if (!form) return; // Si no hay datos, no hacemos nada.

    setSaving(true); // Indicamos que estamos guardando para deshabilitar el botón.
    try {
      // Enviamos los datos actualizados a la API usando el método PUT.
      const res = await fetch(`/api/movements/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form), // Convertimos los datos del formulario a JSON.
      });
      // Si la API devuelve un error, lo lanzamos para que lo capture el 'catch'.
      if (!res.ok) throw new Error();
      // Si todo sale bien, volvemos a la página de la lista de movimientos.
      router.push("/movements");
    } catch {
      // Si hubo un error al guardar, mostramos una alerta.
      alert("No se pudo guardar.");
    } finally {
      // Al final, ya sea con éxito o error, reactivamos el botón de guardar.
      setSaving(false);
    }
  };

  // Mientras los datos del formulario se están cargando, no mostramos nada.
  if (!form) return null;

  // Renderizamos la página con el formulario.
  return (
    <div className="flex h-screen">
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-4 bg-[#f5f5f5] min-h-screen">
          <h1 className="text-2xl mb-4 font-bold">Editar Movimiento</h1>
          
          {/* El formulario para editar los datos */}
          <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 max-w-3xl">
            {/* Campos de entrada para cada dato del movimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>SKU</label>
                <input value={form.sku} onChange={e => handleChange("sku", e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div>
                <label>Producto</label>
                <input value={form.product} onChange={e => handleChange("product", e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div>
                <label>Movimiento</label>
                <select value={form.movement} onChange={e => handleChange("movement", e.target.value)} className="w-full border rounded p-2">
                  <option value="Stock In">Stock In</option>
                  <option value="Stock Out">Stock Out</option>
                </select>
              </div>
              <div>
                <label>Cantidad</label>
                <input type="number" min={1} value={form.quantity} onChange={e => handleChange("quantity", e.target.value)} className="w-full border rounded p-2" />
              </div>
              <div>
                <label>Usuario</label>
                <input value={form.user} onChange={e => handleChange("user", e.target.value)} className="w-full border rounded p-2" />
              </div>
            </div>

            {/* Botones para guardar o cancelar la edición */}
            <div className="mt-6 flex items-center gap-3">
              <button disabled={saving} type="submit" className="bg-[#3F54CE] text-white px-4 py-2 rounded">
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button type="button" onClick={() => router.push("/movements")} className="px-4 py-2 rounded border">
                Cancelar
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}