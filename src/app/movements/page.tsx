"use client";

import Header from '../../../components/Header';
import Sidebar from '../../../components/Sidebar';
import React from "react";

export default function MovementsPage() {
  const [sidebarWidth, setSidebarWidth] = React.useState('64px');

  return (
    <div className="flex h-screen" style={{ margin: 0, padding: 0 }}>
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-8 bg-[#f5f5f5] min-h-screen">
          <h1 className="text-2xl mb-6 font-bold text-[#1F2937]">
            Movements
          </h1>
        </div>
      </div>
    </div>
  );
}
