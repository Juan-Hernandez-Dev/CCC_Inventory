"use client";

import React from 'react';
import { MdEdit, MdClose, MdCheckCircle, MdWarning, MdCancel } from 'react-icons/md';

// Define the Product type
export interface Product {
  id?: number; // opcional: muchos registros no traen id
  sku: string;
  nombre: string;
  precio: number;
  categoria: string;
  stock: number;
  estado: string; // "Available" | "Restock Soon" | "Out of Stock"
}

type Props = {
  products: Product[];
  onEdit?: (p: Product) => void;
  onDelete?: (p: Product) => void;
};

// Helper to render status with color and icon
const StatusCell: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'Available') {
    return (
      <span className="flex items-center justify-center gap-1 text-green-600 font-semibold">
        <MdCheckCircle className="text-green-500" size={18} />
        Available
      </span>
    );
  }
  if (status === 'Restock Soon') {
    return (
      <span className="flex items-center justify-center gap-1 text-yellow-600 font-semibold">
        <MdWarning className="text-yellow-500" size={18} />
        Restock Soon
      </span>
    );
  }
  if (status === 'Out of Stock') {
    return (
      <span className="flex items-center justify-center gap-1 text-red-600 font-semibold">
        <MdCancel className="text-red-500" size={18} />
        Out of Stock
      </span>
    );
  }
  return <span>{status}</span>;
};

const ProductsTable: React.FC<Props> = ({ products, onEdit, onDelete }) => {
  return (
    <div>
      <table className="w-full border-collapse rounded-lg shadow-bottom-sides">
        <thead>
          <tr className="bg-[#FFB349] text-[#1F2937]">
            <th className="p-2 text-center">SKU</th>
            <th className="p-2 text-center">Product</th>
            <th className="p-2 text-center">Price</th>
            <th className="p-2 text-center">Category</th>
            <th className="p-2 text-center">Status</th>
            <th className="p-2 text-center">Stock</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, idx) => (
            <tr
              key={`${product.sku ?? product.id ?? 'no-key'}-${idx}`} // ✅ clave estable y única
              className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}
            >
              <td className="p-2 text-center">{product.sku}</td>
              <td className="p-2 text-left">{product.nombre}</td>
              <td className="p-2 text-center">${product.precio}</td>
              <td className="p-2 text-center">{product.categoria}</td>
              <td className="p-2 text-center">
                <StatusCell status={product.estado} />
              </td>
              <td className="p-2 text-center">{product.stock}</td>
              <td className="p-2 flex justify-center gap-2">
                {/* Edit button */}
                <button
                  type="button"
                  onClick={() => onEdit?.(product)}
                  className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  title="Edit"
                >
                  <MdEdit size={20} />
                </button>
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => onDelete?.(product)}
                  className="w-8 h-8 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white rounded-md"
                  title="Delete"
                >
                  <MdClose size={20} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsTable;
