// Importamos las herramientas necesarias de Next.js y de nuestros archivos.
import { NextResponse } from "next/server";
import { readProducts, upsertProduct, deleteProduct } from "@/lib/jsonDb";
import type { Product } from "@/lib/jsonDb";
import { readMovements } from "@/lib/jsonDbMovements";

// Definimos el tipo para los parámetros que vienen en la URL.
type Params = Promise<{ sku: string }>;

// --- FUNCIÓN GET: OBTENER UN PRODUCTO ---
// Se activa para peticiones GET a /api/products/[sku]
export async function GET(_req: Request, ctx: { params: Params }) {
  // Obtenemos el SKU del producto desde la URL.
  const { sku } = await ctx.params;
  // Leemos todos los productos que existen.
  const productos = await readProducts();
  // Buscamos el producto que coincida con el SKU.
  const item = productos.find((p) => p.sku === sku);
  
  // Si el producto no se encuentra, devolvemos un error 404.
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  // Si se encuentra, lo devolvemos con un estado 200 (OK).
  return NextResponse.json(item, { status: 200 });
}

// --- FUNCIÓN PUT: ACTUALIZAR UN PRODUCTO ---
// Se activa para peticiones PUT a /api/products/[sku]
export async function PUT(req: Request, ctx: { params: Params }) {
  // Obtenemos el SKU de la URL.
  const { sku } = await ctx.params;
  // Obtenemos los nuevos datos del producto que vienen en la petición.
  const b = (await req.json()) as Partial<Product>;

  // 1) Obtenemos el stock final que el usuario quiere ver.
  const stockDeseado = Number(b.stock ?? 0);

  // 2) Calculamos el total de entradas y salidas de stock para este producto.
  const movimientos = await readMovements();
  const delta = movimientos
    .filter((m) => m.sku === sku) // Filtramos solo los movimientos de este SKU.
    .reduce((acc, m) => acc + (m.movement === "Stock In" ? 1 : -1) * Number(m.quantity || 0), 0);

  // 3) Calculamos el nuevo stock base. Este es el valor que se guarda en la base de datos.
  const stockBase = stockDeseado - delta;

  // 4) Creamos el objeto del producto con los datos actualizados.
  const p: Product = {
    sku,
    nombre: String(b.nombre ?? ""),
    categoria: String(b.categoria ?? ""),
    stock: stockBase, // Guardamos el stock base calculado.
    precio: Number(b.precio ?? 0),
  };
  
  // Actualizamos o creamos el producto en la base de datos.
  const productos = await upsertProduct(p);
  // Devolvemos una respuesta de éxito con la lista de productos actualizada.
  return NextResponse.json({ ok: true, productos }, { status: 200 });
}

// --- FUNCIÓN DELETE: BORRAR UN PRODUCTO ---
// Se activa para peticiones DELETE a /api/products/[sku]
export async function DELETE(_req: Request, ctx: { params: Params }) {
  // Obtenemos el SKU del producto que se va a borrar.
  const { sku } = await ctx.params;
  
  // Llamamos a la función para eliminar el producto.
  await deleteProduct(sku);
  
  // Devolvemos una respuesta de éxito.
  return NextResponse.json({ ok: true }, { status: 200 });
}