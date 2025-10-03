"use client"; // ← Obligatorio: este componente usa estado/efectos (Client Component)

import { useMemo, useState } from "react";

/** Tipos para los movimientos */
type MovementType = "Stock In" | "Stock Out";
type Status = "Available" | "Low" | "Out";

/** Estructura de un movimiento individual */
type Movement = {
  id: string;
  date: string; // Formato dd/MM/yyyy (p.ej. "29/09/2025")
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
  price: number;
  category: string;
  status: Status;
  stock: number;
};

/** Datos demo para render */
const INITIAL_MOVES: Movement[] = [
  {
    id: "BOL-012",
    date: "29/09/2025",
    product: "Bolsa negra 60 × 90 cm (B60)",
    sku: "BOL-012",
    movement: "Stock In",
    quantity: 15,
    user: "Jorge Hernández",
    price: 45.5,
    category: "BOLSAS",
    status: "Available",
    stock: 35,
  },
  {
    id: "FER-005",
    date: "29/09/2025",
    product: "Ácido Todo 172ml GDOS",
    sku: "BOL-012",
    movement: "Stock In",
    quantity: 17,
    user: "Juan Hernández",
    price: 34.3,
    category: "FERRETERÍA",
    status: "Available",
    stock: 27,
  },
  {
    id: "AQU-029",
    date: "29/09/2025",
    product: "Agua Oxigenada 125ml PROFESA",
    sku: "BOL-012",
    movement: "Stock In",
    quantity: 13,
    user: "Administrador 1",
    price: 25.2,
    category: "SALUD",
    status: "Available",
    stock: 31,
  },
];

/** Página principal (Mobile 1) */
export default function Page() {
  // --- Estado de filtros y búsqueda ---
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // --- Filtrado de la lista en memoria ---
  const filtered = useMemo(() => {
    // Utilidad para convertir "dd/MM/yyyy" a timestamp
    const toTime = (d: string) => {
      const [dd, mm, yyyy] = d.split("/").map((x) => parseInt(x, 10));
      // new Date(año, mesBaseCero, día) → milisegundos
      return new Date(yyyy, mm - 1, dd).getTime();
    };

    return INITIAL_MOVES.filter((m) => {
      const fitsQuery =
        !q ||
        m.product.toLowerCase().includes(q.toLowerCase()) ||
        m.sku.toLowerCase().includes(q.toLowerCase());

      const fitsCategory = !category || m.category === category;
      const fitsStatus = !status || m.status === status;

      const inRange =
        (!from || toTime(m.date) >= toTime(from)) &&
        (!to || toTime(m.date) <= toTime(to));

      return fitsQuery && fitsCategory && fitsStatus && inRange;
    });
  }, [q, category, status, from, to]);

  // --- UI ---
  return (
    <main className="min-h-dvh w-full flex items-start justify-center px-4 py-5">
      {/* Contenedor del “móvil” */}
      <div className="w-full max-w-[400px]">
        {/* BARRA SUPERIOR */}
        <header className="flex items-center gap-3">
          <button
            aria-label="Abrir menú"
            className="p-2 rounded-md border border-neutral-700"
          >
            <MenuIcon />
          </button>

          <div className="flex items-center gap-3 ml-1">
            {/* Avatar iniciales */}
            <div className="grid place-items-center h-8 w-8 rounded-full bg-neutral-200 text-neutral-900 text-sm font-semibold">
              JH
            </div>

            {/* Nombre + rol */}
            <div className="leading-tight">
              <p className="text-sm font-semibold">Juan Hernández</p>
              <p className="text-[11px] text-neutral-400 -mt-px">Administrador</p>
            </div>

            {/* Desplegable de usuario (decorativo) */}
            <span className="ml-auto">
              <ChevronDownIcon />
            </span>
          </div>
        </header>

        {/* BUSCADOR + BOTÓN DE FILTROS */}
        <section className="mt-4 flex items-center gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
              <SearchIcon />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="w-full pl-9 pr-3 h-10 rounded-md bg-neutral-800 border border-neutral-700 placeholder:text-neutral-400 outline-none"
            />
          </div>

          <button
            aria-label="Abrir filtros"
            className="h-10 w-10 grid place-items-center rounded-md bg-amber-400 text-neutral-900 font-bold"
            title="Filtros"
          >
            <BulbIcon />
          </button>
        </section>

        {/* FILTROS (Category, Status, Rango de fechas) */}
        <section className="mt-3 space-y-2">
          <Dropdown
            label="Category"
            value={category}
            onClear={() => setCategory(null)}
            options={["BOLSAS", "FERRETERÍA", "SALUD", "HIGIENE", "OTROS"]}
            onSelect={setCategory}
          />

          <Dropdown
            label="Status"
            value={status}
            onClear={() => setStatus(null)}
            options={["Available", "Low", "Out"]}
            onSelect={setStatus}
          />

          {/* Rango de fechas */}
          <div className="grid grid-cols-[auto,1fr] gap-2 items-center">
            <span className="text-sm text-neutral-300">From</span>
            <MaskedDateInput
              value={from}
              onChange={setFrom}
              placeholder="DD/MM/YYYY"
            />

            <span className="text-sm text-neutral-300">to</span>
            <MaskedDateInput
              value={to}
              onChange={setTo}
              placeholder="DD/MM/YYYY"
            />
          </div>
        </section>

        {/* TÍTULO DE LA LISTA */}
        <h2 className="mt-4 mb-2 text-xl font-semibold">Movements</h2>

        {/* LISTA DE MOVIMIENTOS */}
        <section className="space-y-3 pb-10">
          {/* Franja azul superior como en el mock */}
          <div className="h-7 rounded-md bg-[#6ea3e1] opacity-60" />

          {/* Render de tarjetas */}
          {filtered.map((m) => (
            <MovementCard key={m.id} m={m} />
          ))}
        </section>
      </div>
    </main>
  );
}

/* ===================== */
/* ====== PIEZAS UI ==== */
/* ===================== */

/** Tarjeta de un movimiento */
function MovementCard({ m }: { m: Movement }) {
  return (
    <article className="rounded-md border border-neutral-700 bg-neutral-800">
      {/* Encabezado con datos principales */}
      <div className="px-3 pt-3 pb-2 text-[13px] leading-5">
        <Row label="Date" value={m.date} />
        <Row label="Product" value={m.product} />
        <Row label="SKU" value={m.sku} />
        <Row label="Movement" value={m.movement} />
        <Row label="Quantity" value={String(m.quantity)} />
        <Row label="User" value={m.user} />

        {/* Acciones */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[13px] font-medium text-neutral-300">
            Actions:
          </span>
          <button className="icon-btn bg-blue-600/90" title="Ver detalle">
            <EyeIcon />
          </button>
          <button className="icon-btn bg-red-600/90" title="Eliminar">
            <XIcon />
          </button>
        </div>
      </div>

      {/* Pie con datos complementarios del inventario */}
      <div className="px-3 pb-3 text-[12px] text-neutral-300">
        <Row small label="Price" value={`$${m.price.toFixed(2)}`} />
        <Row small label="Category" value={m.category} />
        <Row small label="Status" value={m.status} />
        <Row small label="Stock" value={String(m.stock)} />

        <div className="mt-2 flex items-center gap-2">
          <span className="text-[12px]">Actions:</span>
          <button className="icon-btn bg-blue-600/90">
            <EyeIcon />
          </button>
          <button className="icon-btn bg-red-600/90">
            <XIcon />
          </button>
        </div>
      </div>
    </article>
  );
}

/** Fila (label: valor) reutilizable */
function Row({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <p className={small ? "text-[12px]" : "text-[13px]"}>
      <span className="font-medium text-neutral-300">{label}: </span>
      <span className="text-neutral-100">{value}</span>
    </p>
  );
}

/** Dropdown simple sin dependencias externas */
function Dropdown({
  label,
  options,
  value,
  onSelect,
  onClear,
}: {
  label: string;
  options: string[];
  value: string | null;
  onSelect: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Botón principal del dropdown */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full h-10 rounded-md bg-neutral-800 border border-neutral-700 px-3 flex items-center justify-between"
      >
        <span className="text-sm text-neutral-300">{label}</span>
        <span className="flex items-center gap-2">
          {/* Muestra el valor seleccionado en una pildorita */}
          {value && (
            <span className="text-xs bg-neutral-200 text-neutral-900 px-2 py-0.5 rounded">
              {value}
            </span>
          )}
          <ChevronDownIcon />
        </span>
      </button>

      {/* Lista de opciones */}
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-neutral-700 bg-neutral-800">
          <ul className="max-h-44 overflow-auto py-1">
            {options.map((opt) => (
              <li key={opt}>
                <button
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-700 ${
                    value === opt ? "bg-neutral-700" : ""
                  }`}
                  onClick={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>

          {/* Acción para limpiar selección */}
          <div className="p-1 border-t border-neutral-700">
            <button
              className="w-full text-sm py-2 rounded bg-neutral-700 hover:bg-neutral-600"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Input con máscara DD/MM/YYYY (auto-slash) */
function MaskedDateInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  // Normaliza y aplica la máscara
  const handle = (v: string) => {
    const digits = v.replace(/[^\d]/g, "").slice(0, 8);
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(
      Boolean
    );
    onChange(parts.join("/"));
  };

  return (
    <input
      inputMode="numeric"
      value={value}
      onChange={(e) => handle(e.target.value)}
      placeholder={placeholder ?? "DD/MM/YYYY"}
      className="h-10 rounded-md bg-neutral-800 border border-neutral-700 px-3 placeholder:text-neutral-400 outline-none"
    />
  );
}

/* ===================== */
/* ====== ÍCONOS ======= */
/* ===================== */

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-80">
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-70">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 18h6v2H9z" />
      <path d="M12 2a7 7 0 00-4 12c.5.5 1 1.5 1 2h6c0-.5.5-1.5 1-2A7 7 0 0012 2z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
    </svg>
  );


}


