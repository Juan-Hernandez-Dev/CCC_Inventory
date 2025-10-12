export type Product = {
  sku: string;
  nombre: string;
  categoria: string;
  stock: number;
  precio: number;
};

export type MovementType = "Stock In" | "Stock Out";
export type Movement = {
  id: string;
  date: string;   // ISO
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
};
