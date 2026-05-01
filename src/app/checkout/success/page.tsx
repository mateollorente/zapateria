import Link from "next/link";
import { CheckCircle, ShoppingBag, ArrowRight } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-16 animate-in fade-in px-4">
      <div className="text-center space-y-6 max-w-lg bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-900">
          ¡Pago Confirmado!
        </h1>
        
        <p className="text-gray-500 text-lg leading-relaxed">
          Tu pago se ha procesado exitosamente. Ya estamos preparando tu pedido para enviártelo lo antes posible.
        </p>

        <div className="pt-8 flex flex-col sm:flex-row items-center gap-4 justify-center">
          <Link 
            href="/orders" 
            className="flex items-center gap-2 w-full sm:w-auto justify-center px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
            Mis Pedidos
          </Link>
          <Link 
            href="/catalog" 
            className="flex items-center gap-2 w-full sm:w-auto justify-center px-6 py-3 bg-white border-2 border-neutral-200 text-neutral-900 rounded-xl font-medium hover:border-neutral-300 transition-all"
          >
            Seguir Comprando
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
