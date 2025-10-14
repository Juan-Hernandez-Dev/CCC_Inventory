// Importamos las herramientas necesarias: 'fs' para archivos, 'path' para rutas, y 'crypto' para generar IDs únicos.
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

// --- Definición de Tipos ---

// Define los dos únicos tipos de movimiento que existen.
export type MovementType = "Stock In" | "Stock Out";
// Define la estructura de un registro de movimiento.
export type Movement = {
  id: string;
  date: string;           // Fecha en formato estándar ISO
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
};

// --- Configuración del Archivo ---

// Construye la ruta completa al archivo 'movements.json' donde se guardan los datos.
const filePath = path.join(process.cwd(), "data", "movements.json");

// Define las dos posibles formas en que puede estar estructurado el archivo JSON.
// Puede ser un array de movimientos directamente, o un objeto que contiene ese array.
type FileShape = { movements: Movement[] } | Movement[];


// --- Funciones Internas para Manejar el Archivo ---

// Lee el contenido "crudo" del archivo JSON tal como está.
async function readRaw(): Promise<FileShape> {
  try {
    const txt = await fs.readFile(filePath, "utf8");
    return JSON.parse(txt);
  } catch {
    // Si el archivo no existe o falla, devuelve una estructura vacía para evitar errores.
    return { movements: [] };
  }
}

// Escribe datos "crudos" directamente en el archivo JSON.
async function writeRaw(data: FileShape) {
  // Convierte el objeto a un string JSON formateado y lo guarda.
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

// Lee los movimientos y los devuelve siempre como un array limpio.
export async function readMovements(): Promise<Movement[]> {
  const raw = await readRaw();
  // Se asegura de devolver solo el array de movimientos, sin importar la estructura del archivo.
  return Array.isArray(raw) ? raw : raw.movements ?? [];
}

// Escribe una lista de movimientos en el archivo, manteniendo su estructura original.
export async function writeMovements(list: Movement[]) {
  const raw = await readRaw();
  // Revisa cómo estaba el archivo para guardarlo de la misma forma.
  if (Array.isArray(raw)) await writeRaw(list);
  else await writeRaw({ movements: list });
}


// --- Función para Normalizar Fechas ---

// Convierte una fecha en texto (en varios formatos) a un formato estándar (ISO).
function parseToIso(raw?: string): string | null {
  if (!raw) return null;

  // Intenta convertirlo directamente. Funciona para fechas ISO y formatos comunes.
  const d1 = new Date(raw);
  if (!Number.isNaN(d1.getTime())) return d1.toISOString();

  // Si falla, intenta con un formato específico como "dd/mm/yyyy hh:mm:ss".
  const m = raw.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (m) {
    const [, dd, mm, yyyy, hh = 0, mi = 0, ss = 0] = m.map(Number);
    const d2 = new Date(yyyy, mm - 1, dd, hh, mi, ss);
    if (!Number.isNaN(d2.getTime())) return d2.toISOString();
  }
  // Si ningún formato funciona, devuelve nulo.
  return null;
}


// --- Operaciones Principales (CRUD) ---

// Añade un nuevo movimiento a la lista.
export async function addMovement(
  m: Omit<Movement, "id" | "date"> & { date?: string }
) {
  const list = await readMovements();
  // Normaliza la fecha. Si no viene una, usa la fecha y hora actual.
  const iso = parseToIso(m.date) ?? new Date().toISOString();

  // Crea el objeto completo del movimiento, con un ID único y la fecha normalizada.
  const item: Movement = { id: randomUUID(), ...m, date: iso };

  // Añade el nuevo movimiento al principio de la lista.
  list.unshift(item);
  // Guarda la lista actualizada en el archivo.
  await writeMovements(list);
  return item;
}

// Actualiza un movimiento existente por su ID.
export async function updateMovement(id: string, patch: Partial<Movement>) {
  const list = await readMovements();
  const i = list.findIndex((x) => x.id === id); // Busca el movimiento en la lista.
  if (i < 0) return null; // Si no lo encuentra, no hace nada.

  // Si se está actualizando la fecha, la normaliza. Si no, mantiene la original.
  let nextDate = list[i].date;
  if (typeof patch.date === "string") {
    nextDate = parseToIso(patch.date) ?? list[i].date;
  }

  // Crea el objeto actualizado, aplicando los cambios del 'patch'.
  const updated: Movement = {
    ...list[i],
    ...patch,
    date: nextDate, // Usa la fecha válida que calculamos.
  };

  list[i] = updated; // Reemplaza el objeto antiguo por el nuevo en la lista.
  await writeMovements(list);
  return updated;
}

// Elimina un movimiento de la lista por su ID.
export async function deleteMovement(id: string) {
  const list = await readMovements();
  // Crea una nueva lista filtrando y quitando el movimiento con el ID especificado.
  const next = list.filter((x) => x.id !== id);
  // Guarda la nueva lista sin el movimiento eliminado.
  await writeMovements(next);
  return next;
}