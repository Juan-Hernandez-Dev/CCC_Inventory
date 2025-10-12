import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type MovementType = "Stock In" | "Stock Out";
export type Movement = {
  id: string;
  date: string;     // ISO
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
};

const filePath = path.join(process.cwd(), "data", "movements.json");

type FileShape = { movements: Movement[] } | Movement[];

async function readRaw(): Promise<FileShape> {
  const txt = await fs.readFile(filePath, "utf8");
  return JSON.parse(txt);
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

export async function addMovement(partial: Omit<Movement, "id"|"date"> & { date?: string }) {
  const list = await readMovements();
  const m: Movement = {
    id: randomUUID(),
    date: partial.date ?? new Date().toISOString(),
    product: partial.product,
    sku: partial.sku,
    movement: partial.movement,
    quantity: Number(partial.quantity ?? 0),
    user: partial.user,
  };
  list.unshift(m);
  await writeMovements(list);
  return m;
}

export async function updateMovement(id: string, patch: Partial<Movement>) {
  const list = await readMovements();
  const i = list.findIndex(m => m.id === id);
  if (i < 0) return null;
  list[i] = { ...list[i], ...patch, quantity: patch.quantity == null ? list[i].quantity : Number(patch.quantity) };
  await writeMovements(list);
  return list[i];
}

export async function deleteMovement(id: string) {
  const list = await readMovements();
  const next = list.filter(m => m.id !== id);
  await writeMovements(next);
  return next;
}
