import { NextResponse } from "next/server";
import { readProducts, upsertProduct } from "@/lib/jsonDb";
import type { Product } from "@/lib/jsonDb";

export async function GET() {
  const productos = await readProducts();
  return NextResponse.json({ productos }, { status: 200 });
}

export async function POST(req: Request) {
  const b = (await req.json()) as Partial<Product>;
  const required = ["sku", "nombre", "categoria"];
  for (const k of required) {
    if (!b[k as keyof Product]) {
      return NextResponse.json({ error: `Campo ${k} requerido` }, { status: 400 });
    }
  }
  const p: Product = {
    sku: String(b.sku),
    nombre: String(b.nombre),
    categoria: String(b.categoria),
    stock: Number(b.stock ?? 0),
    precio: Number(b.precio ?? 0),
  };
  const productos = await upsertProduct(p);
  return NextResponse.json({ ok: true, productos }, { status: 201 });
}
