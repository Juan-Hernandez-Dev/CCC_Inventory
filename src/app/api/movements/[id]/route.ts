import { NextResponse } from "next/server";
import { readMovements, updateMovement, deleteMovement } from "@/lib/jsonDbMovements";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const list = await readMovements();
  const item = list.find(m => m.id === params.id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const patch = await req.json();
  const updated = await updateMovement(params.id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await deleteMovement(params.id);
  return NextResponse.json({ ok: true });
}
