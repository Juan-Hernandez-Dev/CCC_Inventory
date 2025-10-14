// src/lib/inventory.ts
// Este archivo contiene la lógica principal para calcular el inventario.
// Define los tipos de datos y las funciones clave para saber el stock real de los productos.

// --- Definiciones de Tipos ---

// Define los dos tipos posibles de movimiento de stock.
export type MovementType = "Stock In" | "Stock Out";

// Define la estructura de un registro de movimiento de inventario.
export type Movement = {
  id: string;
  date: string;       // Fecha en formato estándar ISO
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
};

// Define los posibles estados de un producto según su stock.
export type Status = "Available" | "Restock Soon" | "Out of Stock";

// Define la estructura de un producto como se guarda en la base de datos.
export type Product = {
  sku: string;
  nombre: string;
  categoria: string;
  stock: number;      // Este es el stock "base" que viene del archivo JSON.
};


// --- Funciones de Lógica ---

/**
 * Esta es la función más importante. Toma la lista de productos (con su stock base)
 * y la lista de todos los movimientos para calcular el stock real de cada producto.
 */
export function computeEffective(
  products: Product[],
  movements: Movement[]
) {
  // Primero, calculamos el 'delta', que es el cambio neto de stock para cada SKU.
  // Recorremos todos los movimientos y creamos un mapa (ej: { "SKU-01": +10, "SKU-02": -5 }).
  const delta: Record<string, number> = movements.reduce((acc, m) => {
    const sign = m.movement === "Stock In" ? 1 : -1; // Suma si es entrada, resta si es salida.
    acc[m.sku] = (acc[m.sku] ?? 0) + sign * m.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Luego, creamos una nueva lista de productos enriquecida.
  const productsWithEffective = products.map(p => {
    // Calculamos el stock efectivo: stock base + su delta correspondiente.
    const effectiveStock = (p.stock ?? 0) + (delta[p.sku] ?? 0);

    // Determinamos su estado (Disponible, Poco Stock, Agotado) basado en el stock efectivo.
    const status: Status =
      effectiveStock <= 0 ? "Out of Stock"
      : effectiveStock <= 5 ? "Restock Soon"
      : "Available";
    
    // Devolvemos el producto con estos nuevos campos calculados.
    return { ...p, effectiveStock, status };
  });

  // Finalmente, devolvemos la lista de productos enriquecida y el mapa de deltas por si se necesita.
  return { productsWithEffective, deltaBySku: delta };
}

/**
 * Una función de ayuda simple para formatear un objeto de Fecha a un string "dd/mm/yyyy".
 */
export const formatDate = (d: Date) => {
  // Usa `padStart` para asegurar que el día y el mes siempre tengan dos dígitos (ej. 01, 09).
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0"); // getMonth() es base 0, por eso se suma 1.
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};