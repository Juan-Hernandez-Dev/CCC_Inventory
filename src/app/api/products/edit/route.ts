import { NextResponse } from "next/server";
import { deleteProduct, readProducts, upsertProduct } from "@/lib/jsonDb";
import type { Product } from "@/types_inventory/inventory";

export async function GET(
  _req: Request,
  { params }: { params: { sku: string } }
) {
  const productos = await readProducts();
  const item = productos.find((p) => p.sku === params.sku);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item, { status: 200 });
}

export async function PUT(
  req: Request,
  { params }: { params: { sku: string } }
) {
  const body = (await req.json()) as Partial<Product>;
  const toSave: Product = {
    sku: params.sku,
    nombre: String(body.nombre ?? ""),
    categoria: String(body.categoria ?? ""),
    stock: Number(body.stock ?? 0),
    precio: Number(body.precio ?? 0),
  };
  const productos = await upsertProduct(toSave);
  return NextResponse.json({ ok: true, productos }, { status: 200 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { sku: string } }
) {
  await deleteProduct(params.sku);
  // Importante: 200 y un body simple para el cliente
  return NextResponse.json({ ok: true }, { status: 200 });
}
