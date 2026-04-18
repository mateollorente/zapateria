"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Loader2, ShoppingBag, Heart, Star } from "lucide-react";
import { useSession } from "next-auth/react";

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  sizes: { id: string; size: string; stock: number }[];
  reviews?: { rating: number }[];
};

export default function CatalogPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  
  // Filtros
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedQ, setDebouncedQ] = useState(q);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 500);
    return () => clearTimeout(timer);
  }, [q]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQ) params.append("q", debouncedQ);
      if (category !== "ALL") params.append("category", category);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      params.append("page", page.toString());

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setTotalPages(data.pagination.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [debouncedQ, category, minPrice, maxPrice, page]);

  useEffect(() => {
    if (session?.user?.role === "BUYER") {
      fetch("/api/favorites")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            setFavoriteIds(new Set(data.map((f: any) => f.productId)));
          }
        })
        .catch(e => console.error(e));
    }
  }, [session]);

  const toggleFav = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault(); // previene navegación del card en Next
    
    if (session?.user?.role !== "BUYER") {
      alert("Debes iniciar sesión como comprador para guardar favoritos.");
      return;
    }
    
    const newFavs = new Set(favoriteIds);
    if (newFavs.has(productId)) newFavs.delete(productId);
    else newFavs.add(productId);
    setFavoriteIds(newFavs);

    try {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });
    } catch (e) {
      // rollback you could implement
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start animate-in fade-in pb-12 w-full pt-4">
      {/* Sidebar Filtros */}
      <aside className="w-full md:w-64 flex-shrink-0 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6 sticky top-24">
        <div className="flex items-center gap-2 text-indigo-600 font-bold border-b border-gray-100 pb-4">
          <SlidersHorizontal className="w-5 h-5" />
          Filtros de Búsqueda
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Buscar por nombre</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Nike Air, Botas..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Categoría</label>
          <select
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Todos los calzados</option>
            <option value="URBAN">Urbano</option>
            <option value="SPORT">Deportivo</option>
            <option value="FORMAL">Formal</option>
            <option value="SANDALS">Sandalias</option>
            <option value="BOOTS">Botas</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Rango de Precio</label>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="number"
              placeholder="Min"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-neutral-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setPage(1);
              }}
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              placeholder="Max"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-neutral-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </aside>

      {/* Main Grid */}
      <div className="flex-1 w-full space-y-6">
        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">Nuestro Catálogo</h1>
        
        {loading && products.length === 0 ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neutral-900">No hay productos</h3>
            <p className="text-gray-500 mt-2">Intenta modificar los filtros de búsqueda.</p>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}>
              {products.map((p) => {
                const isOutOfStock = p.sizes.every(s => s.stock === 0);
                const isFav = favoriteIds.has(p.id);

                return (
                  <Link href={`/catalog/${p.id}`} key={p.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 relative">
                    
                    <button 
                      onClick={(e) => toggleFav(e, p.id)}
                      className={`absolute top-3 right-3 z-10 p-2.5 backdrop-blur rounded-full shadow-sm transition-all border ${isFav ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white/90 text-gray-400 hover:text-indigo-600 border-gray-100'}`}
                      title={isFav ? "Quitar de Favoritos" : "Añadir a Favoritos"}
                    >
                      <Heart className="w-5 h-5" fill={isFav ? "currentColor" : "none"} />
                    </button>

                    <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
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
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                          {p.category}
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-bold text-neutral-900">${p.price.toFixed(2)}</span>
                          {p.reviews && p.reviews.length > 0 && (
                            <span className="flex items-center text-xs font-medium text-amber-500 mt-0.5">
                              <Star className="w-3 h-3 fill-amber-500 mr-0.5" /> 
                              {(p.reviews.reduce((a, b) => a + b.rating, 0) / p.reviews.length).toFixed(1)} 
                              <span className="text-gray-400 ml-1">({p.reviews.length})</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className="font-bold text-neutral-900 text-lg line-clamp-1">{p.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 flex-1 line-clamp-2">{p.sizes.map(s => s.size).join(" • ")}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 bg-white text-neutral-900 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 font-medium text-sm text-neutral-900 bg-white border border-gray-200 rounded-lg shadow-sm">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-200 bg-white text-neutral-900 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
