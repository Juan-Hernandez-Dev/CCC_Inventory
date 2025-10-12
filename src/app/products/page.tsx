"use client";

import Header from '../../../components/Header';  // Header component import
import ProductsTable from '../../../components/ProductsTable';  // ProductsTable component import
import data from '../../../data/productos.json';  // Products base data
import movementsData from '../../../data/movements.json';  // ⬅️ Movements data (nuevo)
import Sidebar from '../../../components/Sidebar';  // Sidebar component import
import React from "react";
import { MdSearch, MdFilterList } from "react-icons/md";  // Icons import

// ===== Tipos locales (solo para cálculo; no cambian tu UI) =====
type MovementType = "Stock In" | "Stock Out";
type Movement = {
  id: string;
  date: string;      // ISO
  product: string;
  sku: string;
  movement: MovementType;
  quantity: number;
  user: string;
};

type Product = {
  sku: string;
  nombre: string;
  categoria: string;
  stock: number;     // stock base del JSON
  estado?: string;   // puede venir en el JSON, pero lo derivaremos
};

type Status = "Available" | "Restock Soon" | "Out of Stock";

export default function Page() {  // Page component definition
  const [sidebarWidth, setSidebarWidth] = React.useState('64px');  // Width state for Sidebar
  const [search, setSearch] = React.useState('');  // Search state
  const [category, setCategory] = React.useState('');  // Category filter state
  const [status, setStatus] = React.useState('');  // Status filter state

  // ===== 1) Leer datos base =====
  const baseProducts = React.useMemo(
    () => ((data as any).productos ?? (data as any)) as Product[],
    []
  );

  const movements = React.useMemo(
    () => ((movementsData as any).movements ?? (movementsData as any)) as Movement[],
    []
  );

  // ===== 2) Calcular delta por SKU a partir de movimientos =====
  const deltaBySku = React.useMemo(() => {
    return movements.reduce((acc: Record<string, number>, m) => {
      const sign = m.movement === "Stock In" ? 1 : -1;
      acc[m.sku] = (acc[m.sku] ?? 0) + sign * m.quantity;
      return acc;
    }, {});
  }, [movements]);

  // ===== 3) Derivar productos con stock efectivo y status =====
  // IMPORTANTÍSIMO: mantenemos las MISMAS llaves que usa tu UI/tabla:
  // - Sobrescribimos p.stock con el stock efectivo
  // - Sobrescribimos p.estado con el status derivado
  const derivedProducts = React.useMemo(() => {
    return baseProducts.map((p) => {
      const effectiveStock = (p.stock ?? 0) + (deltaBySku[p.sku] ?? 0);
      const derivedStatus: Status =
        effectiveStock <= 0 ? "Out of Stock" :
        effectiveStock <= 5 ? "Restock Soon" :
        "Available";

      return {
        ...p,
        stock: effectiveStock,     // ⬅️ tu tabla seguirá leyendo p.stock, pero ahora es efectivo
        estado: derivedStatus      // ⬅️ y p.estado ahora es el estado derivado
      };
    });
  }, [baseProducts, deltaBySku]);

  // ===== 4) Estado de productos filtrados (sobre la lista derivada) =====
  const [filteredProducts, setFilteredProducts] = React.useState<Product[]>(derivedProducts);

  React.useEffect(() => {  // Effect to filter products based on search, category, and status
    const term = search.toLowerCase();
    setFilteredProducts(
      derivedProducts.filter(
        (p) =>
          (p.sku.toLowerCase().includes(term) ||
            p.nombre.toLowerCase().includes(term)) &&
          (category === '' || p.categoria === category) &&  // Filter by category if selected
          (status === '' || (p.estado as string) === status)  // Filter by status if selected (usamos estado derivado)
      )
    );
  }, [search, category, status, derivedProducts]);

  return (  // JSX return statement (SIN CAMBIOS DE DISEÑO)
    <div className="flex h-screen" style={{ margin: 0, padding: 0 }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-4">
          <h1 className="text-2xl mb-4" style={{ fontWeight: 'bold', color: '#1F2937' }}>All the Products</h1>
          <div className="flex space-x-4 mb-4">
            <div className="flex items-center w-full max-w-md bg-white rounded border">
              <span className="pl-2 text-gray-400">
                <MdSearch size={22} />
              </span>
              {/* Search input */}
              <input
                type="text"
                placeholder="Search"
                className="flex-1 p-2 outline-none bg-transparent"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <span className="pr-2 pl-2 bg-[#FFB349] h-full flex items-center rounded-r">
                <MdFilterList size={22} className="text-white" />
              </span>
            </div>
            <select
              className="p-2 border rounded bg-white"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="">Category</option>
              <option value="BOLSAS">BOLSAS</option>
              <option value="FERRETERIA">FERRETERIA</option>
              <option value="PERFUMERIA">PERFUMERIA</option>
              <option value="LIQ. 5 LITROS">LIQ. 5 LITROS</option>
              <option value="ESCOBAS">ESCOBAS</option>
              <option value="FIBRAS">FIBRAS</option>
              <option value="LIQ. 1 LITRO">LIQ. 1 LITRO</option>
              <option value="JARCERIA">JARCERIA</option>
              <option value="PASTILLA/AROMA">PASTILLA/AROMA</option>
              <option value="PAPEL">PAPEL</option>
              <option value="VENENO">VENENO</option>
              <option value="DESPACHADORES">DESPACHADORES</option>
              <option value="LIQ. 500 ML">LIQ. 500 ML</option>
              <option value="TRAPADORES BG">TRAPADORES BG</option>
              <option value="DULCERIA">DULCERIA</option>
            </select>
            <select
              className="p-2 border rounded bg-white"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="">Status</option>
              <option value="Available">Available</option>
              <option value="Restock Soon">Restock Soon</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <button
              type="button"
              className="bg-[#3F54CE] text-white p-2 rounded hover:bg-blue-600 transition-colors"
            >
              Add Product
            </button>
          </div>

          {/* 👇 Tu tabla queda idéntica; ahora recibe productos ya derivados */}
          <ProductsTable products={filteredProducts as any} />
        </div>
      </div>
    </div>
  );
}
