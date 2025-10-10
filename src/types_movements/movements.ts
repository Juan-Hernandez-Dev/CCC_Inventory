export type MovementType = "Stock In" | "Stock Out";

export interface Movement {
  id: string;
  date: string;          // ISO string
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
}
