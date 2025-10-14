// Define los dos únicos tipos de movimiento de inventario que existen.
// Un movimiento solo puede ser una entrada ("Stock In") o una salida ("Stock Out").
export type MovementType = "Stock In" | "Stock Out";

// Define la "forma" o estructura de un registro de movimiento.
// Cada vez que se añade o quita stock, se crea un objeto con estas propiedades.
export interface Movement {
  id: string;         // Un identificador único para este movimiento.
  date: string;       // La fecha y hora en que se hizo, en formato estándar ISO.
  product: string;    // El nombre del producto que se movió.
  sku: string;        // El SKU del producto, para saber cuál es.
  movement: MovementType; // El tipo de movimiento (si fue entrada o salida).
  quantity: number;   // La cantidad de unidades que se movieron.
  user: string;       // Quién hizo el movimiento (ej. "Admin", "Sistema").
}