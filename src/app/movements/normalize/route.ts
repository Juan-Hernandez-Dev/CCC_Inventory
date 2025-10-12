import { NextResponse } from "next/server";
import { readMovements, writeMovements } from "@/lib/jsonDbMovements";

function tryParseLegacy(raw?: string): string | null {
  if (!raw || typeof raw !== "string") return null;

  // ¿ya es parseable por Date?
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();

  // dd/MM/yyyy HH:mm(:ss)
  const m = raw.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    const hh = Number(m[4] ?? 0);
    const mi = Number(m[5] ?? 0);
    const ss = Number(m[6] ?? 0);
    const d = new Date(yyyy, mm - 1, dd, hh, mi, ss);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null; // si no se pudo, no lo tocamos
}

// Lanza un POST a /api/movements/normalize UNA SOLA VEZ
export async function POST() {
  const list = await readMovements();
  let updated = 0;

  const next = list.map((m) => {
    const iso = tryParseLegacy(m.date);
    if (iso && iso !== m.date) {
      updated++;
      return { ...m, date: iso };
    }
    return m;
  });

  if (updated > 0) await writeMovements(next);
  return NextResponse.json({ ok: true, updated }, { status: 200 });
}
