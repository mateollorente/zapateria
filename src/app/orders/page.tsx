"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, PackageOpen, CheckCircle2, Clock, XCircle, ShoppingBag } from "lucide-react";

type OrderItem = {
  id: string;
  size: string;
  quantity: number;
  price: number;
  product: {
    name: string;
    images: string[];
    category: string;
  };
};

type Order = {
  id: string;
  total: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  createdAt: string;
  mpPreferenceId: string | null;
  items: OrderItem[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 font-bold rounded-full text-xs uppercase tracking-wider border border-green-200"><CheckCircle2 className="w-4 h-4"/> Completada</span>;
      case "PENDING":
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 font-bold rounded-full text-xs uppercase tracking-wider border border-yellow-200"><Clock className="w-4 h-4"/> Pendiente Pago</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 font-bold rounded-full text-xs uppercase tracking-wider border border-red-200"><XCircle className="w-4 h-4"/> Cancelada</span>;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex-1 pt-6 pb-12 animate-in fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <PackageOpen className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Mis Compras</h1>
          <p className="text-gray-500">Historial completo de tus pedidos y estado de entrega.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm max-w-2xl mx-auto mt-12">
          <PackageOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-neutral-900">Aún no tienes pedidos</h3>
          <p className="text-gray-500 mt-2 mb-8">Tu historial está vacío. Visita la tienda y realiza tu primera compra segura.</p>
          <Link href="/catalog" className="inline-flex px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            Ir de compras
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((o) => (
            <div key={o.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              
              {/* Header */}
              <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-x-8 gap-y-2">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Fecha de Orden</p>
                    <p className="text-sm font-medium text-neutral-900">{new Date(o.createdAt).toLocaleDateString("es-AR", { year: 'numeric', month: 'long', day: 'numeric'})}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Total</p>
                    <p className="text-sm font-medium text-neutral-900">${o.total.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Orden N°</p>
                    <p className="text-sm font-mono text-gray-600">#{o.id.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(o.status)}
                  {o.status === "PENDING" && o.mpPreferenceId && (
                    <a
                      href={`https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${o.mpPreferenceId}`}
                      className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
                    >
                      Reintentar Pago
                    </a>
                  )}
                </div>
              </div>

              {/* Contenido / Items */}
              <div className="divide-y divide-gray-100">
                {o.items.map(item => (
                  <div key={item.id} className="p-6 flex items-center gap-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200">
                       {item.product.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-8 h-8 text-gray-300" />
                        )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-neutral-900">{item.product.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">Categoría: {item.product.category} • Talla seleccionada: <strong>{item.size}</strong></p>
                      <div className="text-sm font-medium mt-2 flex items-center gap-4">
                        <span className="text-neutral-900 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg">Cantidad: {item.quantity}</span>
                        <span className="text-indigo-600 font-bold">${item.price.toFixed(2)} c/u</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
