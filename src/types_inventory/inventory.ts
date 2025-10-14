// Define la "forma" o estructura de un objeto de producto.
// Cada producto en el sistema debe tener estas propiedades.
export type Product = {
  sku: string;        // El identificador único del producto (ej. "BOL-001").
  nombre: string;     // El nombre completo del producto (ej. "Bolsa Negra Grande").
  categoria: string;  // La categoría a la que pertenece (ej. "BOLSAS").
  stock: number;      // El "stock base" que se guarda en el archivo de datos.
  precio: number;     // El precio de venta del producto.
};

// Define los dos únicos tipos de movimiento de inventario permitidos.
// Un movimiento solo puede ser una entrada o una salida.
export type MovementType = "Stock In" | "Stock Out";

// Define la estructura de un registro de movimiento.
// Cada vez que se añade o quita stock, se crea un objeto con esta forma.
export type Movement = {
  id: string;         // Un identificador único para este movimiento.
  date: string;       // La fecha y hora en que ocurrió, en formato estándar ISO.
  product: string;    // El nombre del producto que se movió.
  sku: string;        // El SKU del producto, para vincularlo.
  movement: MovementType; // El tipo de movimiento (entrada o salida).
  quantity: number;   // La cantidad de unidades que se movieron.
  user: string;       // Quién realizó el movimiento (ej. "Admin", "Sistema").
};