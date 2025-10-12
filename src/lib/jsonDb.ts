import { promises as fs } from "fs";
import path from "path";

export type Product = {
  sku: string;
  nombre: string;
  categoria: string;
  stock: number;
  precio: number;
};

const filePath = path.join(process.cwd(), "data", "productos.json");

type FileShape = { productos: Product[] } | Product[];

async function readRaw(): Promise<FileShape> {
  try {
    const txt = await fs.readFile(filePath, "utf8");
    return JSON.parse(txt);
  } catch {
    return { productos: [] };
  }
}
async function writeRaw(data: FileShape) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function readProducts(): Promise<Product[]> {
  const raw = await readRaw();
  return Array.isArray(raw) ? raw : raw.productos ?? [];
}

export async function writeProducts(list: Product[]) {
  const raw = await readRaw();
  if (Array.isArray(raw)) await writeRaw(list);
  else await writeRaw({ productos: list });
}

export async function upsertProduct(p: Product) {
  const list = await readProducts();
  const i = list.findIndex(x => x.sku === p.sku);
  if (i >= 0) list[i] = p;
  else list.push(p);
  await writeProducts(list);
  return list;
}

export async function deleteProduct(sku: string) {
  const list = await readProducts();
  const next = list.filter(x => x.sku !== sku);
  await writeProducts(next);
  return next;
}
