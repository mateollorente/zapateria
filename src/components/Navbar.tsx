"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { ShoppingBag, LogOut } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-neutral-900 tracking-tighter">
          <ShoppingBag className="h-6 w-6 text-indigo-600" />
          Zapatería
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/catalog" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
            Catálogo
          </Link>
          
          {session?.user.role === "SELLER" && (
            <Link href="/seller" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
              Panel de Ventas
            </Link>
          )}

          {session?.user.role === "BUYER" && (
            <>
              <Link href="/favorites" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                Favoritos
              </Link>
              <Link href="/orders" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                Mis Compras
              </Link>
              <Link href="/cart" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                Carrito
              </Link>
            </>
          )}

          {status === "loading" ? (
            <div className="h-8 w-20 bg-gray-200 animate-pulse rounded-md ml-4" />
          ) : session ? (
            <div className="flex items-center gap-4 border-l border-gray-200 pl-6 ml-2">
              <span className="text-sm font-medium text-gray-700 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">
                {session.user.name || session.user.email} <span className="text-xs text-indigo-600 ml-1 font-bold">({session.user.role === 'BUYER' ? 'Comprador' : 'Vendedor'})</span>
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center gap-2"
                title="Cerrar Sessión"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Salir</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 border-l border-gray-200 pl-6 ml-2">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                Ingresar
              </Link>
              <Link href="/register" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 hover:shadow-md transition-all shadow-sm">
                Registro
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
