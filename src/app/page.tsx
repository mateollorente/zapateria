import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Star, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-16 py-12 animate-in fade-in">
      <div className="text-center max-w-3xl px-4 space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium">
          <Star className="w-4 h-4" fill="currentColor" />
          <span>Nueva Colección Otoño-Invierno 2026</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-neutral-900">
          Camina con <span className="text-indigo-600">Estilo</span>,<br /> Pisada a Pisada.
        </h1>
        
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Descubre nuestra exclusiva selección de calzados de alta costura, diseñados para brindarte la máxima comodidad y elegancia en cada paso que das.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link 
            href="/catalog" 
            className="flex items-center gap-2 w-full sm:w-auto justify-center px-8 py-4 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-all hover:scale-105"
          >
            <ShoppingBag className="w-5 h-5" />
            Explorar Catálogo
          </Link>
          <Link 
            href="/register" 
            className="flex items-center gap-2 w-full sm:w-auto justify-center px-8 py-4 bg-white border-2 border-neutral-200 text-neutral-900 rounded-xl font-medium hover:border-neutral-300 transition-all"
          >
            Crear Cuenta
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl px-4">
        {[
          { icon: TrendingUp, title: "Últimas Tendencias", desc: "Constantemente renovamos nuestro stock con la moda actual." },
          { icon: Star, title: "Calidad Premium", desc: "Solo trabajamos con los mejores materiales del mercado." },
          { icon: ShoppingBag, title: "Envíos Globales", desc: "Llega a la puerta de tu casa, estés donde estés." },
        ].map((feature, i) => (
          <div key={i} className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm text-center space-y-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <feature.icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-xl text-neutral-900">{feature.title}</h3>
            <p className="text-gray-500">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
