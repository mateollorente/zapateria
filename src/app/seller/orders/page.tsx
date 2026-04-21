"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PackageOpen, CheckCircle2, Clock, XCircle, ShoppingBag } from "lucide-react";

type SellerSale = {
  id: string;
  orderId: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  date: string;
  buyer: { name: string; email: string };
  product: { id: string; name: string; category: string; image: string | null };
  size: string;
  quantity: number;
  price: number;
  total: number;
};

export default function SellerOrdersPage() {
  const [sales, setSales] = useState<SellerSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seller/orders")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSales(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 font-bold rounded-full text-xs uppercase tracking-wider border border-green-200"><CheckCircle2 className="w-4 h-4"/> Pagada</span>;
      case "PENDING":
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 font-bold rounded-full text-xs uppercase tracking-wider border border-yellow-200"><Clock className="w-4 h-4"/> Pendiente</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 font-bold rounded-full text-xs uppercase tracking-wider border border-red-200"><XCircle className="w-4 h-4"/> Cancelada</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-12 pt-4">
      <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
        <Link href="/seller" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Historial de Ventas</h1>
          <p className="text-sm text-gray-500">Consulta los detalles exactos de cada par vendido.</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse text-gray-400">Cargando ventas...</div>
      ) : sales.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm max-w-2xl mx-auto mt-12">
          <PackageOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-neutral-900">Aún no hay ventas</h3>
          <p className="text-gray-500 mt-2 mb-8">Cuando un cliente compre uno de tus productos, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-center">Detalles</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider">Comprador</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-center">Fecha y Estado</th>
                  <th className="px-6 py-4 font-bold text-xs text-gray-500 uppercase tracking-wider text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden border border-gray-100 flex items-center justify-center flex-shrink-0">
                          {sale.product.image ? (
                            <img src={sale.product.image} className="w-full h-full object-cover" alt="Producto" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900 leading-tight">{sale.product.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Categoría: {sale.product.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-block px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-neutral-700 shadow-sm mr-2">
                        Talla: {sale.size}
                      </span>
                      <span className="text-sm font-medium text-gray-600">x{sale.quantity}</span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-neutral-900">{sale.buyer?.name || "Usuario Anónimo"}</p>
                      <p className="text-xs text-indigo-600 font-medium">{sale.buyer?.email || "Sin email"}</p>
                    </td>
                    <td className="px-6 py-5 text-center space-y-1">
                      <div>{getStatusBadge(sale.status)}</div>
                      <p className="text-xs text-gray-500">
                        {new Date(sale.date).toLocaleDateString("es-AR", { year: 'numeric', month: 'short', day: 'numeric'})}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className="font-extrabold text-neutral-900">${sale.total.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-1">Ord: #{sale.orderId.slice(-6).toUpperCase()}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
