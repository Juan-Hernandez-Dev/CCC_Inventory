import { NextResponse } from "next/server";
import { readProducts, upsertProduct, deleteProduct } from "@/lib/jsonDb";
import type { Product } from "@/lib/jsonDb";

type Params = Promise<{ sku: string }>;

export async function GET(_req: Request, ctx: { params: Params }) {
  const { sku } = await ctx.params;
  const productos = await readProducts();
  const item = productos.find((p) => p.sku === sku);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item, { status: 200 });
}

export async function PUT(req: Request, ctx: { params: Params }) {
  const { sku } = await ctx.params;
  const body = (await req.json()) as Partial<Product>;

  const productos = await readProducts();
  const existente = productos.find((p) => p.sku === sku);

  if (!existente) {
    // Crear SIN stock (stock = 0). Stock solo por Movements.
    const nuevo: Product = {
      sku,
      nombre: String(body.nombre ?? ""),
      categoria: String(body.categoria ?? ""),
      stock: 0,
      precio: Number(body.precio ?? 0),
    };
    const out = await upsertProduct(nuevo);
    return NextResponse.json({ ok: true, productos: out }, { status: 200 });
  }

  // Editar sin tocar stock
  const actualizado: Product = {
    sku,
    nombre: String(body.nombre ?? existente.nombre),
    categoria: String(body.categoria ?? existente.categoria),
    stock: existente.stock, // ← intocable aquí
    precio: Number(body.precio ?? existente.precio),
  };
  const out = await upsertProduct(actualizado);
  return NextResponse.json({ ok: true, productos: out }, { status: 200 });
}

export async function DELETE(_req: Request, ctx: { params: Params }) {
  const { sku } = await ctx.params;
  await deleteProduct(sku);
  return NextResponse.json({ ok: true }, { status: 200 });
}
