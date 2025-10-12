import { NextResponse } from "next/server";
import { deleteProduct, readProducts, upsertProduct } from "@/lib/jsonDb";
import { Product } from "@/types_inventory/inventory";

export async function GET(
  _req: Request,
  { params }: { params: { sku: string } }
) {
  const productos = await readProducts();
  const item = productos.find((p) => p.sku === params.sku);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(
  req: Request,
  { params }: { params: { sku: string } }
) {
  const body = (await req.json()) as Partial<Product>;
  const toSave: Product = {
    sku: params.sku,
    nombre: body.nombre ?? "",
    categoria: body.categoria ?? "",
    stock: Number(body.stock ?? 0),
    precio: Number(body.precio ?? 0),
  };
  const productos = await upsertProduct(toSave);
  return NextResponse.json({ productos });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { sku: string } }
) {
  const productos = await deleteProduct(params.sku);
  return NextResponse.json({ productos });
}
