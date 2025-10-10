"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdDashboard, MdInventory2, MdSwapHoriz, MdMenu } from 'react-icons/md';

const menuItems = [
  { name: 'Dashboard', path: '/', icon: <MdDashboard size={20} /> },
  { name: 'Products', path: '/products', icon: <MdInventory2 size={20} /> },
  { name: 'Movements', path: '/movements', icon: <MdSwapHoriz size={20} /> },
];

const Sidebar: React.FC<{ onWidthChange: (width: string) => void }> = ({ onWidthChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    onWidthChange(isExpanded ? '256px' : '48px'); // Ajustamos a w-64 (256px) y w-12 (48px)
  }, [isExpanded, onWidthChange]);

  return (
    <div
      className={`h-screen bg-[#23293C] text-white ${
        isExpanded ? 'w-64' : 'w-12'
      } flex flex-col transition-all duration-300`}
      style={{ position: 'fixed', top: 0, left: 0, margin: 0, padding: 0, zIndex: 10 }}
    >
      <div className="flex items-center justify-between px-3 py-4">
        {isExpanded && (
          <h2 className="text-lg font-bold tracking-wide">Inventory System</h2>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white focus:outline-none"
        >
          <MdMenu size={24} />
        </button>
      </div>
      <nav className="mt-4 flex flex-col gap-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-2 py-2 rounded-l-lg font-medium transition-colors
                ${isActive
                  ? 'bg-[#23293C] border-l-4 border-cyan-400 text-cyan-400 shadow'
                  : 'text-gray-400 hover:bg-[#23293C] hover:text-cyan-400'
                }`}
              style={{
                background: isActive
                  ? 'linear-gradient(90deg, #23293C 80%, #23293C00 100%)'
                  : undefined,
              }}
            >
              <span
                className={`flex items-center justify-center ${
                  isActive
                    ? 'bg-cyan-400 text-[#23293C]'
                    : 'bg-[#2D344B] text-gray-400'
                } rounded-md w-6 h-6`}
              >
                {item.icon}
              </span>
              {isExpanded && <span className="text-base">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;