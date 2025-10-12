import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type MovementType = "Stock In" | "Stock Out";
export type Movement = {
  id: string;
  date: string;
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
};

const filePath = path.join(process.cwd(), "data", "movements.json");

type FileShape = { movements: Movement[] } | Movement[];

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

// --- Helpers de normalización ---
function parseToIso(raw?: string): string {
  // Si ya es válida, devuélvela en ISO “limpio”
  if (raw && !Number.isNaN(new Date(raw).getTime())) {
    return new Date(raw).toISOString();
  }
  // Fallback dd/MM/yyyy HH:mm(:ss)
  if (raw) {
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
      const d = new Date(yyyy, mm - 1, dd, hh, mi, ss);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }
  // Último recurso: ahora
  return new Date().toISOString();
}

export async function addMovement(
  m: Omit<Movement, "id" | "date"> & { date?: string }
) {
  const list = await readMovements();
  const item: Movement = {
    id: randomUUID(),
    date: parseToIso(m.date),
    ...m,
  };
  list.unshift(item);
  await writeMovements(list);
  return item;
}

export async function updateMovement(id: string, patch: Partial<Movement>) {
  const list = await readMovements();
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return null;

  const next = { ...list[i], ...patch };
  if ("date" in patch) {
    next.date = parseToIso(patch.date);
  }
  list[i] = next;

  await writeMovements(list);
  return list[i];
}

export async function deleteMovement(id: string) {
  const list = await readMovements();
  const next = list.filter((x) => x.id !== id);
  await writeMovements(next);
  return next;
}
