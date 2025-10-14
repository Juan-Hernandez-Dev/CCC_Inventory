// Importamos las herramientas de Next.js y nuestras funciones para la base de datos.
import { NextResponse } from "next/server";
import { readProducts, upsertProduct } from "@/lib/jsonDb";
import type { Product } from "@/lib/jsonDb";

// --- FUNCIÓN GET: OBTENER TODOS LOS PRODUCTOS ---
// Se activa para peticiones GET a /api/products
export async function GET() {
  // Leemos la lista completa de productos desde el archivo JSON.
  const productos = await readProducts();
  // Devolvemos la lista encontrada con un estado 200 (OK).
  return NextResponse.json({ productos }, { status: 200 });
}

// --- FUNCIÓN POST: CREAR UN NUEVO PRODUCTO ---
// Se activa para peticiones POST a /api/products
export async function POST(req: Request) {
  // Obtenemos los datos del nuevo producto que se enviaron en la petición.
  const b = (await req.json()) as Partial<Product>;

  // Definimos qué campos son obligatorios para crear un producto.
  const required = ["sku", "nombre", "categoria"];

  // Revisamos uno por uno si los campos obligatorios fueron enviados.
  for (const k of required) {
    // Si falta alguno de los campos requeridos...
    if (!b[k as keyof Product]) {
      // ...devolvemos un error 400 diciendo qué campo falta.
      return NextResponse.json({ error: `Campo ${k} requerido` }, { status: 400 });
    }
  }

  // Si todos los campos obligatorios están, creamos el objeto del producto.
  // Nos aseguramos de que cada valor tenga el tipo de dato correcto.
  const p: Product = {
    sku: String(b.sku),
    nombre: String(b.nombre),
    categoria: String(b.categoria),
    stock: Number(b.stock ?? 0),   // Si no viene stock, el valor es 0.
    precio: Number(b.precio ?? 0), // Si no viene precio, el valor es 0.
  };

  // Guardamos el nuevo producto en nuestro archivo JSON.
  const productos = await upsertProduct(p);

  // Devolvemos una respuesta de éxito (estado 201) con la lista de productos actualizada.
  return NextResponse.json({ ok: true, productos }, { status: 201 });
}