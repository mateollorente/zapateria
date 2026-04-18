"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Heart, HeartOff, ShoppingBag } from "lucide-react";

type FavoriteItem = {
  id: string; // favorite ID
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    images: string[];
    sizes: { id: string; size: string; stock: number }[];
  }
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await fetch("/api/favorites");
      if (res.ok) {
        const data = await res.json();
        setFavorites(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (productId: string) => {
    try {
      // Optimistic update
      setFavorites(favorites.filter(f => f.productId !== productId));
      
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });
      
      if (!res.ok) {
        // Rollback on failure simply by refetching
        fetchFavorites();
      }
    } catch (e) {
      alert("Error al quitar favorito");
      fetchFavorites();
    }
  };

  return (
    <div className="w-full space-y-6 flex-1 pt-4 pb-12 animate-in fade-in">
      <div className="flex items-center gap-3">
        <Heart className="w-8 h-8 text-indigo-600" fill="currentColor" />
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Tus Favoritos</h1>
      </div>
      <p className="text-gray-500 max-w-2xl">Aquí encontrarás los modelos de zapatillas que has guardado. No los pierdas de vista porque el stock puede agotarse rápido.</p>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm max-w-2xl mx-auto mt-12">
          <HeartOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-neutral-900">Aún no tienes favoritos</h3>
          <p className="text-gray-500 mt-2 mb-6">Empieza a explorar nuestro catálogo y guarda lo que más te guste presionando el corazón en las zapatillas.</p>
          <Link href="/catalog" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
            Explorar Catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map((fav) => {
            const p = fav.product;
            const isOutOfStock = p.sizes.every(s => s.stock === 0);

            return (
              <div key={fav.id} className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                <button 
                  onClick={() => removeFavorite(p.id)}
                  className="absolute top-3 right-3 z-10 p-2.5 bg-white/90 backdrop-blur rounded-full text-indigo-600 hover:text-red-500 shadow-sm hover:bg-red-50 transition-all border border-gray-100 hover:border-red-100"
                  title="Quitar de Favoritos"
                >
                  <Heart className="w-5 h-5" fill="currentColor" />
                </button>

                <Link href={`/catalog/${p.id}`} className="aspect-[4/3] bg-gray-100 relative overflow-hidden block">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  
                  {isOutOfStock && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      AGOTADO
                    </div>
                  )}
                </Link>
                
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                      {p.category}
                    </span>
                    <span className="text-lg font-bold text-neutral-900">${p.price.toFixed(2)}</span>
                  </div>
                  <Link href={`/catalog/${p.id}`}>
                    <h3 className="font-bold text-neutral-900 text-lg line-clamp-1 group-hover:text-indigo-600 transition-colors">{p.name}</h3>
                  </Link>
                  <p className="text-sm text-gray-500 mt-1 flex-1 line-clamp-1">{p.sizes.map(s => s.size).join(" • ")}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
