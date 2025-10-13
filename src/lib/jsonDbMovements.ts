import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type MovementType = "Stock In" | "Stock Out";
export type Movement = {
  id: string;
  date: string;           // ISO
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
};

const filePath = path.join(process.cwd(), "data", "movements.json");

type FileShape = { movements: Movement[] } | Movement[];

// ---- utils de archivo
async function readRaw(): Promise<FileShape> {
  try {
    const txt = await fs.readFile(filePath, "utf8");
    return JSON.parse(txt);
  } catch {
    return { movements: [] };
  }
}
async function writeRaw(data: FileShape) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}
export async function readMovements(): Promise<Movement[]> {
  const raw = await readRaw();
  return Array.isArray(raw) ? raw : raw.movements ?? [];
}
export async function writeMovements(list: Movement[]) {
  const raw = await readRaw();
  if (Array.isArray(raw)) await writeRaw(list);
  else await writeRaw({ movements: list });
}

// ---- normalización de fecha
function parseToIso(raw?: string): string | null {
  if (!raw || typeof raw !== "string") return null;

  const d1 = new Date(raw);
  if (!Number.isNaN(d1.getTime())) return d1.toISOString();

  const m = raw.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    const hh = Number(m[4] ?? 0);
    const mi = Number(m[5] ?? 0);
    const ss = Number(m[6] ?? 0);
    const d2 = new Date(yyyy, mm - 1, dd, hh, mi, ss);
    if (!Number.isNaN(d2.getTime())) return d2.toISOString();
  }
  return null;
}

// ---- operaciones
export async function addMovement(
  m: Omit<Movement, "id" | "date"> & { date?: string }
) {
  const list = await readMovements();
  const iso = parseToIso(m.date) ?? new Date().toISOString();

  // IMPORTANTE: primero spread, luego date -> así no se pisa con undefined
  const item: Movement = { id: randomUUID(), ...m, date: iso };

  list.unshift(item);
  await writeMovements(list);
  return item;
}

export async function updateMovement(id: string, patch: Partial<Movement>) {
  const list = await readMovements();
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return null;

  let nextDate = list[i].date;
  if (typeof patch.date === "string") {
    nextDate = parseToIso(patch.date) ?? list[i].date;
  }

  const updated: Movement = {
    ...list[i],
    ...patch,
    date: nextDate, // asegurar que prevalezca la fecha válida
  };

  list[i] = updated;
  await writeMovements(list);
  return updated;
}

export async function deleteMovement(id: string) {
  const list = await readMovements();
  const next = list.filter((x) => x.id !== id);
  await writeMovements(next);
  return next;
}
