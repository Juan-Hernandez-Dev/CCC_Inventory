import { NextResponse } from "next/server";
import { readMovements, addMovement } from "@/lib/jsonDbMovements";
import type { Movement } from "@/lib/jsonDbMovements";

// GET: devolver tal cual está guardado (sin normalizar en respuesta)
export async function GET() {
  const list = await readMovements();
  return NextResponse.json({ movements: list }, { status: 200 });
}

// Deja tu POST como lo pusimos antes (convierte tipos y delega normalización a addMovement)
export async function POST(req: Request) {
  try {
    const b = await req.json();

    const sku = String(b.sku ?? "").trim();
    const product = String(b.product ?? "").trim();
    const user = String(b.user ?? "System").trim();

    let movement: "Stock In" | "Stock Out";
    const mv = String(b.movement ?? "").toLowerCase();
    if (mv.startsWith("stock in") || mv === "in") movement = "Stock In";
    else if (mv.startsWith("stock out") || mv === "out") movement = "Stock Out";
    else movement =
      b.movement === "Stock In" || b.movement === "Stock Out"
        ? b.movement
        : "Stock In";

    const quantity = Number(b.quantity ?? 0);

    if (!sku || !product) {
      return NextResponse.json(
        { error: "SKU y Product son requeridos." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: "Cantidad inválida." },
        { status: 400 }
      );
    }

    const date: string | undefined =
      typeof b.date === "string" && b.date.trim() ? b.date : undefined;

    const saved: Movement = await addMovement({
      sku,
      product,
      movement,
      quantity,
      user,
      date,
      id: "" as never,
    } as any);

    return NextResponse.json({ ok: true, movement: saved }, { status: 201 });
  } catch (e) {
    console.error("POST /api/movements error:", e);
    return NextResponse.json(
      { error: "No se pudo crear el movimiento." },
      { status: 500 }
    );
  }
}
