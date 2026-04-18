"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Package, Search, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

type SellerStats = {
  totalSales: number;
  totalRevenue: number;
  salesByProduct: { name: string; quantity: number; revenue: number }[];
};

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/seller/products");
      const data = await res.json();
      if (res.ok) setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/seller/stats");
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (e) {
      console.error(e);
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
    <div className="space-y-8 animate-in fade-in pb-16 pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Análisis de Ventas</h1>
          <p className="text-gray-500 mt-1 font-medium">Visualiza tus ingresos, rastrea tu inventario y gestiona publicaciones.</p>
        </div>
        <Link
          href="/seller/products/new"
          className="flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-xl font-bold shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all"
        >
          <Plus className="w-5 h-5" />
          Nueva Zapatilla
        </Link>
      </div>

      {/* METRIC CARDS HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:border-indigo-100 transition-colors">
          <div className="bg-green-50 p-4 rounded-2xl text-green-600">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ingresos Totales</p>
            <p className="text-3xl font-extrabold text-neutral-900">${stats?.totalRevenue.toFixed(2) || "0.00"}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:border-indigo-100 transition-colors">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pares Vendidos</p>
            <p className="text-3xl font-extrabold text-neutral-900">{stats?.totalSales || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:border-indigo-100 transition-colors">
          <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Publicaciones</p>
            <p className="text-3xl font-extrabold text-neutral-900">{totalProducts}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:border-indigo-100 transition-colors">
          <div className="bg-amber-50 p-4 rounded-2xl text-amber-600">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stock Restante</p>
            <p className="text-3xl font-extrabold text-neutral-900">{totalStock}</p>
          </div>
        </div>
      </div>

      {/* CHART & VISUALS */}
      {stats && stats.salesByProduct.length > 0 && (
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2"><TrendingUp className="text-indigo-600"/> Rendimiento por Zapatilla (Top 5)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.salesByProduct} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string) => [name === 'quantity' ? `${value} pares` : `$${value}`, name === 'quantity' ? 'Vendidos' : 'Ingresos']}
                />
                <Bar dataKey="quantity" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CRUD TABLE */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden mt-12">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Package className="text-indigo-600"/> Inventario de Tienda
          </h2>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Filtro rápido (Pronto)..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-center">Categoría</th>
                <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-center">Talles & Stock</th>
                <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Precio Unit.</th>
                <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    Cargando información...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-gray-400">
                    <Package className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                    <p className="text-lg font-medium text-neutral-900">Tu vitrina está vacía</p>
                    <p className="text-sm mt-1">Crea tu primera zapatailal desde el botón Nueva Zapatilla.</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex-shrink-0 flex justify-center items-center overflow-hidden border border-gray-100 group-hover:border-indigo-100 transition-colors">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 text-base">{product.name}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">#{product.id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-lg">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-wrap gap-1.5 justify-center max-w-[220px] mx-auto">
                        {product.sizes.map((s) => (
                          <span key={s.id} className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border ${s.stock === 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-gray-700 border-gray-200 shadow-sm'}`} title={`Stock de la talla ${s.size}: ${s.stock} pares`}>
                            {s.size} <span className={s.stock === 0 ? 'text-red-400' : 'text-gray-400'}>({s.stock})</span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="font-extrabold text-neutral-900">${product.price.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/seller/products/edit/${product.id}`}
                          className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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
