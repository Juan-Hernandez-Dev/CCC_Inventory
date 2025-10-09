"use client";

import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import React from "react";

export default function DashboardPage() {
  const [sidebarWidth, setSidebarWidth] = React.useState('256px');

  return (
    <div className="flex h-screen">
      <Sidebar onWidthChange={setSidebarWidth} />
      <div className="flex-1" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-[#1F2937]">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded shadow p-6 text-center">
              <div className="text-2xl font-semibold text-[#3F54CE]">120</div>
              <div className="text-gray-500 mt-2">Total Products</div>
            </div>
            <div className="bg-white rounded shadow p-6 text-center">
              <div className="text-2xl font-semibold text-[#3F54CE]">8</div>
              <div className="text-gray-500 mt-2">Categories</div>
            </div>
            <div className="bg-white rounded shadow p-6 text-center">
              <div className="text-2xl font-semibold text-[#3F54CE]">15</div>
              <div className="text-gray-500 mt-2">Movements Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}