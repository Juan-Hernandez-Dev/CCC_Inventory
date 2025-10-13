import { NextResponse } from "next/server";
import { addMovement, readMovements } from "@/lib/jsonDbMovements";
import type { MovementType } from "@/lib/jsonDbMovements";

export async function GET() {
  const list = await readMovements();
  return NextResponse.json({ movements: list }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const b = await req.json();

    // 🚿 Saneamos el body => no dejamos pasar id/date desde el cliente
    const product = String(b.product ?? "").trim();
    const sku = String(b.sku ?? "").trim();
    const movement = (String(b.movement ?? "") as MovementType);
    const quantity = Number(b.quantity ?? 0);
    const user = String(b.user ?? "System").trim();

    if (!product || !sku || !["Stock In", "Stock Out"].includes(movement) || !Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const created = await addMovement({
      product,
      sku,
      movement,
      quantity,
      user,
      // ⛔ no pasamos id ni date
    });

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create movement" }, { status: 500 });
  }
}
