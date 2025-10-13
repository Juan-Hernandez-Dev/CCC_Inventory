import { NextResponse } from "next/server";
import { readProducts, upsertProduct, deleteProduct } from "@/lib/jsonDb";
import type { Product } from "@/lib/jsonDb";
import { readMovements } from "@/lib/jsonDbMovements"; 

// Next 15: params es asíncrono
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
  const b = (await req.json()) as Partial<Product>;

  // 1) Stock deseado que viene del form (lo que quieres ver en la tabla)
  const stockDeseado = Number(b.stock ?? 0);

  // 2) Delta acumulado por movimientos para este SKU
  const movimientos = await readMovements();
  const delta = movimientos
    .filter((m) => m.sku === sku)
    .reduce((acc, m) => acc + (m.movement === "Stock In" ? 1 : -1) * Number(m.quantity || 0), 0);

  // 3) Calcular el "stock base" para que base + delta == stockDeseado
  const stockBase = stockDeseado - delta;

  // 4) Guardar el producto con ese stock base ajustado
  const p: Product = {
    sku,
    nombre: String(b.nombre ?? ""),
    categoria: String(b.categoria ?? ""),
    stock: stockBase,
    precio: Number(b.precio ?? 0),
  };
  const productos = await upsertProduct(p);
  return NextResponse.json({ ok: true, productos }, { status: 200 });
}

export async function DELETE(_req: Request, ctx: { params: Params }) {
  const { sku } = await ctx.params;
  await deleteProduct(sku);
  return NextResponse.json({ ok: true }, { status: 200 });
}
