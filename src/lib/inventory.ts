// src/lib/inventory.ts
export type MovementType = "Stock In" | "Stock Out";
export type Movement = {
  id: string;
  date: string;      // ISO
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
};

export type Status = "Available" | "Restock Soon" | "Out of Stock";

export type Product = {
  sku: string;
  nombre: string;
  categoria: string;
  stock: number;     // stock base (JSON productos)
};

export function computeEffective(
  products: Product[],
  movements: Movement[]
) {
  // Delta por SKU según movimientos
  const delta: Record<string, number> = movements.reduce((acc, m) => {
    const sign = m.movement === "Stock In" ? 1 : -1;
    acc[m.sku] = (acc[m.sku] ?? 0) + sign * m.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Productos con stock efectivo + estado derivado
  const productsWithEffective = products.map(p => {
    const effectiveStock = (p.stock ?? 0) + (delta[p.sku] ?? 0);
    const status: Status =
      effectiveStock <= 0 ? "Out of Stock"
      : effectiveStock <= 5 ? "Restock Soon"
      : "Available";
    return { ...p, effectiveStock, status };
  });

  return { productsWithEffective, deltaBySku: delta };
}

export const formatDate = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};
