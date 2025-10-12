import { NextResponse } from "next/server";
import { deleteProduct, readProducts, upsertProduct } from "@/lib/jsonDb";
import type { Product } from "@/lib/jsonDb";

export async function GET(_req: Request, { params }: { params: { sku: string } }) {
  const productos = await readProducts();
  const item = productos.find((p) => p.sku === params.sku);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item, { status: 200 });
}

export async function PUT(req: Request, { params }: { params: { sku: string } }) {
  const b = (await req.json()) as Partial<Product>;
  const p: Product = {
    sku: params.sku,
    nombre: String(b.nombre ?? ""),
    categoria: String(b.categoria ?? ""),
    stock: Number(b.stock ?? 0),
    precio: Number(b.precio ?? 0),
  };
  const productos = await upsertProduct(p);
  return NextResponse.json({ ok: true, productos }, { status: 200 });
}

export async function DELETE(_req: Request, { params }: { params: { sku: string } }) {
  await deleteProduct(params.sku);
  return NextResponse.json({ ok: true }, { status: 200 });
}
