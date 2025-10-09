"use client";
import React from 'react';

const Header = () => (
  <header className="flex items-center justify-between bg-white px-6 py-4 shadow">
    <div className="flex items-center gap-4">
      <img src="/CCC.png" alt="CCC" className="h-10" />
      <span className="font-bold text-lg text-blue-900">Comercializadora Castro Cervantes</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center font-bold text-gray-700">JH</div>
      <div>
        <div className="font-semibold text-gray-800">Juan Hernández</div>
        <div className="text-xs text-gray-500">Administrador</div>
      </div>
    </div>
  </header>
);

export default Header;