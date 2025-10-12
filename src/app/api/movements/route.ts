import { NextResponse } from "next/server";
import { readMovements, addMovement } from "@/lib/jsonDbMovements";

export async function GET() {
  const movements = await readMovements();
  return NextResponse.json({ movements });
}

export async function POST(req: Request) {
  const body = await req.json();
  const required = ["product", "sku", "movement", "quantity", "user"];
  for (const k of required) {
    if (body[k] == null || body[k] === "") {
      return NextResponse.json({ error: `Campo ${k} requerido` }, { status: 400 });
    }
  }
  const created = await addMovement(body);
  return NextResponse.json(created, { status: 201 });
}
