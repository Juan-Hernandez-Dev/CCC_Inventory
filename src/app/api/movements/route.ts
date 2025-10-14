// Importamos lo que necesitamos: NextResponse para las respuestas y nuestras funciones para manejar los movimientos.
import { NextResponse } from "next/server";
import { addMovement, readMovements } from "@/lib/jsonDbMovements";
import type { MovementType } from "@/lib/jsonDbMovements";

// --- FUNCIÓN GET: OBTENER TODOS LOS MOVIMIENTOS ---
// Se activa para peticiones GET a /api/movements
export async function GET() {
  // Leemos la lista completa de movimientos desde nuestro archivo JSON.
  const list = await readMovements();
  // Devolvemos la lista encontrada con un estado 200 (OK).
  return NextResponse.json({ movements: list }, { status: 200 });
}

// --- FUNCIÓN POST: CREAR UN NUEVO MOVIMIENTO ---
// Se activa para peticiones POST a /api/movements
export async function POST(req: Request) {
  // Usamos un bloque try...catch para manejar cualquier error que pueda ocurrir.
  try {
    // Obtenemos los datos que el usuario envió en la petición.
    const b = await req.json();

    // Limpiamos y validamos los datos recibidos para asegurar que todo esté correcto.
    const product = String(b.product ?? "").trim();
    const sku = String(b.sku ?? "").trim();
    const movement = (String(b.movement ?? "") as MovementType); // Puede ser "Stock In" o "Stock Out".
    const quantity = Number(b.quantity ?? 0);
    const user = String(b.user ?? "System").trim(); // Si no viene un usuario, ponemos "System".

    // Comprobamos si los datos esenciales son válidos.
    if (!product || !sku || !["Stock In", "Stock Out"].includes(movement) || quantity <= 0) {
      // Si algún dato es incorrecto, devolvemos un error 400.
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Si los datos son correctos, llamamos a la función para agregar el nuevo movimiento.
    // El 'id' y la 'date' se generan automáticamente en el servidor por seguridad.
    const created = await addMovement({
      product,
      sku,
      movement,
      quantity,
      user,
    });

    // Devolvemos el movimiento recién creado con un estado 201 (Creado exitosamente).
    return NextResponse.json(created, { status: 201 });
  } catch {
    // Si algo falla durante el proceso, devolvemos un error 500.
    return NextResponse.json({ error: "Failed to create movement" }, { status: 500 });
  }
}