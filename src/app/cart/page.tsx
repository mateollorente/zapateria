"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag, Minus, Plus, Trash2, ArrowRight, ShieldCheck } from "lucide-react";

type CartItem = {
  id: string;
  productSizeId: string;
  quantity: number;
  productSize: {
    id: string;
    size: string;
    stock: number;
    product: {
      id: string;
      name: string;
      price: number;
      category: string;
      images: string[];
    };
  };
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, action: "increment" | "decrement") => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    if (action === "increment") {
      const sizeStock = item.productSize.stock;
      if (item.quantity >= sizeStock) {
        alert("No hay más stock disponible en esta talla.");
        return;
      }
    }

    try {
      setItems(items.map(i => {
        if (i.id === itemId) return { ...i, quantity: action === "increment" ? i.quantity + 1 : i.quantity - 1 };
        return i;
      }).filter(i => i.quantity > 0));

      const res = await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, action })
      });
      if (!res.ok) fetchCart();
    } catch (e) {
      fetchCart();
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setItems(items.filter(i => i.id !== itemId));
      const res = await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
      if (!res.ok) fetchCart();
    } catch (e) {
      fetchCart();
    }
  };

  const subtotal = items.reduce((acc, item) => acc + item.productSize.product.price * item.quantity, 0);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/orders", { method: "POST" });
      if (res.ok) {
        router.push("/orders");
      } else {
        const data = await res.json();
        alert(data.error || "Error al generar la compra");
      }
    } catch {
      alert("Error de red");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex-1 pt-6 pb-12 animate-in fade-in">
      <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight mb-8">Tu Carrito de Compras</h1>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm max-w-2xl mx-auto mt-12">
          <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-neutral-900">Tu carrito está vacío</h3>
          <p className="text-gray-500 mt-2 mb-8">Parece que aún no has agregado nada a tu carrito. Explora nuestras colecciones y encuentra lo mejor para ti.</p>
          <Link href="/catalog" className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            Ir a comprar <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Lista de productos */}
          <div className="w-full lg:flex-1 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 relative group">
                <Link href={`/catalog/${item.productSize.product.id}`} className="w-full sm:w-32 h-32 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {item.productSize.product.images?.[0] ? (
                    <img src={item.productSize.product.images[0]} alt={item.productSize.product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <ShoppingBag className="w-8 h-8 text-gray-300" />
                  )}
                </Link>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Link href={`/catalog/${item.productSize.product.id}`}>
                          <h3 className="font-bold text-lg text-neutral-900 group-hover:text-indigo-600 transition-colors">{item.productSize.product.name}</h3>
                        </Link>
                        <p className="text-sm font-medium text-gray-500 mt-1">Talla: <span className="text-neutral-900 border border-gray-200 px-2 py-0.5 rounded-md ml-1">{item.productSize.size}</span></p>
                      </div>
                      <p className="font-bold text-lg text-neutral-900">${(item.productSize.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 sm:mt-0">
                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                      <button 
                        onClick={() => updateQuantity(item.id, "decrement")}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-neutral-900 hover:bg-white rounded-md transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center font-medium text-sm text-neutral-900">{item.quantity}</span>
                      <button 
                         onClick={() => updateQuantity(item.id, "increment")}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-neutral-900 hover:bg-white rounded-md transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Panel */}
          <div className="w-full lg:w-96 bg-gray-50 p-6 rounded-2xl border border-gray-200 sticky top-24">
            <h2 className="text-xl font-bold text-neutral-900 mb-6 border-b border-gray-200 pb-4">Resumen de Orden</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({items.reduce((a,b) => a+b.quantity, 0)} pares)</span>
                <span className="font-medium text-neutral-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Envío estimado</span>
                <span className="text-green-600 font-medium tracking-wide">GRATIS</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-bold text-neutral-900">Total a pagar</span>
                <span className="text-3xl font-extrabold text-neutral-900">${subtotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Impuestos incluidos si aplican.</p>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-4 bg-neutral-900 text-white rounded-xl font-bold text-lg hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 mb-4 flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pagar Orden (Simulado)"}
            </button>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Tu transacción es segura y encriptada
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
