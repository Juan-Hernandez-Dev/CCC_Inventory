import { promises as fs } from "fs";
import path from "path";
import { Product } from "@/types_inventory/inventory";

const productsPath = path.join(process.cwd(), "data", "productos.json");

type ProductsFileShape =
  | { productos: Product[] }
  | Product[]; // por si tu archivo es arreglo plano

async function readRaw(): Promise<ProductsFileShape> {
  const buf = await fs.readFile(productsPath, "utf8");
  return JSON.parse(buf);
}

async function writeRaw(data: ProductsFileShape) {
  const pretty = JSON.stringify(data, null, 2);
  await fs.writeFile(productsPath, pretty, "utf8");
}

export async function readProducts(): Promise<Product[]> {
  const raw = await readRaw();
  return Array.isArray(raw) ? raw : raw.productos ?? [];
}

export async function writeProducts(products: Product[]): Promise<void> {
  // preserva el formato original si venía como { productos: [...] }
  const raw = await readRaw();
  if (Array.isArray(raw)) {
    await writeRaw(products);
  } else {
    await writeRaw({ productos: products });
  }
}

export async function upsertProduct(p: Product): Promise<Product[]> {
  const products = await readProducts();
  const idx = products.findIndex((x) => x.sku === p.sku);
  if (idx >= 0) products[idx] = p;
  else products.push(p);
  await writeProducts(products);
  return products;
}

export async function deleteProduct(sku: string): Promise<Product[]> {
  const products = await readProducts();
  const next = products.filter((x) => x.sku !== sku);
  await writeProducts(next);
  return next;
}
