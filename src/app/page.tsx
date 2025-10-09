"use client";

import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import React from "react";

export default function Page() {
  const [sidebarWidth, setSidebarWidth] = React.useState('64px');

  return (
    <div className="flex h-screen" style={{ margin: 0, padding: 0 }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-[#1F2937]">Dashboard</h1>
          {/* Aquí puedes agregar widgets, gráficas, KPIs, etc */}
          <div className="bg-white rounded shadow p-6">
            <p className="text-lg text-gray-700">
              ¡Bienvenido al sistema de inventario! Aquí verás un resumen de tu operación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}