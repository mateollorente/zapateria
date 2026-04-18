"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Package, Search, ExternalLink, ShoppingBag } from "lucide-react";

type ProductSize = {
  id: string;
  size: string;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  sizes: ProductSize[];
  images: string[];
};

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/seller/products");
      const data = await res.json();
      if (res.ok) {
        setProducts(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este producto? Esta acción es irreversible.")) return;

    try {
      const res = await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      } else {
        alert("Error al eliminar");
      }
    } catch (e) {
      alert("Error de conexión");
    }
  };

  const totalProducts = products.length;
  const totalStock = products.reduce(
    (acc, p) => acc + p.sizes.reduce((sum, s) => sum + s.stock, 0),
    0
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Panel de Ventas</h1>
          <p className="text-gray-500 mt-1">Gestiona tu catálogo, inventario y variantes de calzado.</p>
        </div>
        <Link
          href="/seller/products/new"
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm hover:bg-indigo-700 transition-all hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          Nueva Zapatilla
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Zapatillas Publicadas</p>
            <p className="text-2xl font-bold text-neutral-900">{totalProducts}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-green-50 p-4 rounded-xl text-green-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Stock Total (Pares)</p>
            <p className="text-2xl font-bold text-neutral-900">{totalStock}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 p-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar zapatos..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-white">
                <th className="px-6 py-4 font-medium text-sm text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 font-medium text-sm text-gray-500 uppercase tracking-wider text-center">Categoría</th>
                <th className="px-6 py-4 font-medium text-sm text-gray-500 uppercase tracking-wider text-center">Talles (Stock)</th>
                <th className="px-6 py-4 font-medium text-sm text-gray-500 uppercase tracking-wider text-right">Precio</th>
                <th className="px-6 py-4 font-medium text-sm text-gray-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    Cargando catálogo...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>No has publicado ninguna zapatilla todavía.</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 flex justify-center items-center overflow-hidden border border-gray-200">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">{product.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-wrap gap-1 justify-center max-w-[200px] mx-auto">
                        {product.sizes.map((s) => (
                          <span key={s.id} className="inline-flex text-xs font-medium px-1.5 py-0.5 rounded border border-gray-200 bg-white shadow-sm" title={`Stock: ${s.stock}`}>
                            {s.size} <span className="text-gray-400 ml-1">({s.stock})</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-neutral-900">${product.price.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/seller/products/edit/${product.id}`}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
