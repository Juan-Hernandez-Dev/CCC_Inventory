// Importamos los módulos 'fs' para manejar archivos y 'path' para construir rutas de archivo.
import { promises as fs } from "fs";
import path from "path";

// --- Definición de Tipos ---

// Define la estructura de un objeto de tipo Producto.
export type Product = {
  sku: string;
  nombre: string;
  categoria: string;
  stock: number;
  precio: number;
};

// --- Configuración del Archivo ---

// Construye la ruta completa al archivo 'productos.json' donde se guardan los datos.
const filePath = path.join(process.cwd(), "data", "productos.json");

// Define las dos posibles formas en que puede estar estructurado el archivo JSON.
// Puede ser un array de productos directamente, o un objeto que contiene el array.
type FileShape = { productos: Product[] } | Product[];


// --- Funciones Internas (Bajo Nivel) ---

// Lee el contenido "crudo" del archivo JSON tal como está.
async function readRaw(): Promise<FileShape> {
  try {
    // Intenta leer el archivo de texto.
    const txt = await fs.readFile(filePath, "utf8");
    // Convierte el texto a un objeto JavaScript (JSON).
    return JSON.parse(txt);
  } catch {
    // Si el archivo no existe o hay un error, devuelve una estructura vacía.
    return { productos: [] };
  }
}

// Escribe datos "crudos" directamente en el archivo JSON.
async function writeRaw(data: FileShape) {
  // Convierte el objeto JavaScript a un string JSON formateado y lo guarda en el archivo.
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}


// --- Funciones Públicas (Alto Nivel) ---

// Lee la lista de productos y la devuelve siempre como un array limpio.
export async function readProducts(): Promise<Product[]> {
  const raw = await readRaw();
  // Comprueba si el archivo es un array o un objeto y devuelve solo el array de productos.
  return Array.isArray(raw) ? raw : raw.productos ?? [];
}

// Escribe una lista de productos en el archivo, manteniendo su estructura original.
export async function writeProducts(list: Product[]) {
  const raw = await readRaw();
  // Revisa la estructura original para guardar los datos de la misma forma.
  if (Array.isArray(raw)) {
    await writeRaw(list);
  } else {
    await writeRaw({ productos: list });
  }
}

// Actualiza un producto si ya existe (por SKU), o lo crea si es nuevo.
export async function upsertProduct(p: Product) {
  const list = await readProducts();
  const i = list.findIndex(x => x.sku === p.sku); // Busca el índice del producto.

  if (i >= 0) {
    // Si lo encuentra, lo reemplaza en esa posición.
    list[i] = p;
  } else {
    // Si no lo encuentra, lo añade al final de la lista.
    list.push(p);
  }

  // Guarda la lista actualizada en el archivo.
  await writeProducts(list);
  return list; // Devuelve la lista actualizada.
}

// Elimina un producto de la lista usando su SKU.
export async function deleteProduct(sku: string) {
  const list = await readProducts();
  // Crea una nueva lista que contiene todos los productos excepto el que se va a borrar.
  const next = list.filter(x => x.sku !== sku);
  // Guarda la nueva lista sin el producto eliminado.
  await writeProducts(next);
  return next; // Devuelve la lista actualizada.
}