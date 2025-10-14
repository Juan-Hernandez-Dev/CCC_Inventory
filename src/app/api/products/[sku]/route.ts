// Importamos las herramientas de Next.js y nuestras funciones para la base de datos de productos.
import { NextResponse } from "next/server";
import { readProducts, upsertProduct, deleteProduct } from "@/lib/jsonDb";
import type { Product } from "@/lib/jsonDb";

// Definimos cómo se verán los parámetros que vienen en la URL (en este caso, el SKU).
type Params = Promise<{ sku: string }>;

// --- FUNCIÓN GET: OBTENER UN SOLO PRODUCTO ---
// Se activa para peticiones GET a /api/products/[sku]
export async function GET(_req: Request, ctx: { params: Params }) {
  // Obtenemos el SKU del producto desde la URL.
  const { sku } = await ctx.params;
  // Leemos todos los productos existentes.
  const productos = await readProducts();
  // Buscamos el producto que coincida con el SKU.
  const item = productos.find((p) => p.sku === sku);

  // Si no lo encontramos, devolvemos un error 404.
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Si lo encontramos, lo devolvemos como respuesta.
  return NextResponse.json(item, { status: 200 });
}

// --- FUNCIÓN PUT: ACTUALIZAR O CREAR UN PRODUCTO ---
// Se activa para peticiones PUT a /api/products/[sku]
export async function PUT(req: Request, ctx: { params: Params }) {
  // Obtenemos el SKU de la URL y los datos enviados en la petición.
  const { sku } = await ctx.params;
  const body = (await req.json()) as Partial<Product>;

  // Leemos los productos para verificar si ya existe uno con ese SKU.
  const productos = await readProducts();
  const existente = productos.find((p) => p.sku === sku);

  // Si el producto NO existe, lo creamos.
  if (!existente) {
    // Creamos el objeto del nuevo producto.
    // Importante: El stock inicial siempre es 0. Solo se modifica con movimientos.
    const nuevo: Product = {
      sku,
      nombre: String(body.nombre ?? ""),
      categoria: String(body.categoria ?? ""),
      stock: 0,
      precio: Number(body.precio ?? 0),
    };
    // Guardamos el nuevo producto.
    const out = await upsertProduct(nuevo);
    return NextResponse.json({ ok: true, productos: out }, { status: 200 });
  }

  // Si el producto SÍ existe, lo actualizamos.
  const actualizado: Product = {
    sku,
    nombre: String(body.nombre ?? existente.nombre),
    categoria: String(body.categoria ?? existente.categoria),
    stock: existente.stock, // El stock no se modifica desde aquí, se mantiene el que ya tenía.
    precio: Number(body.precio ?? existente.precio),
  };
  // Guardamos los cambios del producto actualizado.
  const out = await upsertProduct(actualizado);
  return NextResponse.json({ ok: true, productos: out }, { status: 200 });
}

// --- FUNCIÓN DELETE: BORRAR UN PRODUCTO ---
// Se activa para peticiones DELETE a /api/products/[sku]
export async function DELETE(_req: Request, ctx: { params: Params }) {
  // Obtenemos el SKU del producto que se va a eliminar.
  const { sku } = await ctx.params;
  // Llamamos a la función para borrarlo.
  await deleteProduct(sku);
  // Devolvemos una respuesta de éxito.
  return NextResponse.json({ ok: true }, { status: 200 });
}