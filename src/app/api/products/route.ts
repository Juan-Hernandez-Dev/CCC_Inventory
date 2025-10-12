import { NextResponse } from "next/server";
import { readProducts, upsertProduct } from "@/lib/jsonDb";
import { Product } from "@/types_inventory/inventory";

export async function GET() {
  const productos = await readProducts();
  return NextResponse.json({ productos });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Product>;
  // validación sencilla
  if (!body?.sku || !body?.nombre || !body?.categoria || body.stock == null || body.precio == null) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }
  const productos = await upsertProduct(body as Product);
  return NextResponse.json({ productos }, { status: 201 });
}
