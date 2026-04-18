"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Loader2, Heart, CheckCircle2, Star } from "lucide-react";
import { useSession } from "next-auth/react";

type ProductDetails = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  sizes: { id: string; size: string; stock: number }[];
  seller: { name: string; email: string };
};

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [mainImage, setMainImage] = useState<string>("");
  
  const [isFav, setIsFav] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const addToCart = async () => {
    if (session?.user?.role !== "BUYER") {
      alert("Debes iniciar sesión como comprador para usar el carrito.");
      return;
    }
    
    if (!selectedSize) return;

    setAddingToCart(true);
    try {
      const sizeStr = product?.sizes.find(s => s.id === selectedSize)?.size;
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id, size: sizeStr })
      });
      if (res.ok) {
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "No se pudo añadir al carrito.");
      }
    } catch (e) {
      alert("Error al añadir al carrito");
    } finally {
      setAddingToCart(false);
    }
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
          setRelated(data.related);
          if (data.product.images?.length > 0) {
            setMainImage(data.product.images[0]);
          }
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    
    // Si somos comprador, buscar si es favorito
    if (session?.user?.role === "BUYER") {
      fetch("/api/favorites")
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const hasIt = data.some((f: any) => f.productId === id);
            setIsFav(hasIt);
          }
        })
        .catch(e => console.error(e));
    }
  }, [id, session]);

  const toggleFav = async () => {
    if (session?.user?.role !== "BUYER") {
      alert("Debes iniciar sesión como comprador para guardar favoritos.");
      return;
    }
    
    setIsFav(!isFav);
    try {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id })
      });
    } catch {
      setIsFav(isFav); // rollback
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold text-neutral-900">Producto no encontrado</h2>
        <Link href="/catalog" className="text-indigo-600 hover:underline">Volver al catálogo</Link>
      </div>
    );
  }

  const isOutOfStock = product.sizes.every(s => s.stock === 0);

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in pb-16 pt-6">
      
      <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-neutral-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al catálogo
      </Link>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* Galería de imágenes */}
        <div className="w-full lg:w-1/2 space-y-4">
          <div className="aspect-square bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm shadow-indigo-100 flex items-center justify-center relative">
            {mainImage ? (
              <img src={mainImage} className="w-full h-full object-cover" alt={product.name} />
            ) : (
              <ShoppingBag className="w-24 h-24 text-gray-200" />
            )}
            
            <button 
              onClick={toggleFav}
              className={`absolute top-4 right-4 p-3 backdrop-blur rounded-full shadow-sm transition-all border ${isFav ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-white/80 text-gray-400 hover:text-indigo-600 border-gray-100'}`}
            >
              <Heart className="w-6 h-6" fill={isFav ? "currentColor" : "none"} />
            </button>
          </div>

          {product.images?.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setMainImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${mainImage === img ? 'border-indigo-600 shadow-md scale-105' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info del Producto */}
        <div className="w-full lg:w-1/2 flex flex-col space-y-8">
          <div className="space-y-4">
            <span className="text-sm font-bold text-indigo-600 tracking-wider uppercase bg-indigo-50 px-3 py-1 rounded-full">
              {product.category}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 text-gray-500 text-sm font-medium">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-emerald-500" fill="currentColor"/> 
                Vendido por {product.seller?.name || product.seller?.email || 'Tienda Oficial'}
              </span>
            </div>
          </div>

          <div className="text-4xl font-extrabold text-neutral-900">
            ${product.price.toFixed(2)}
          </div>

          <p className="text-lg text-gray-600 leading-relaxed">
            {product.description}
          </p>

          <div className="space-y-4 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-end">
              <h3 className="font-bold text-neutral-900">Selecciona tu talla</h3>
              {selectedSize && (
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4"/> Talla Disponible
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {product.sizes.map((s) => (
                <button
                  key={s.id}
                  disabled={s.stock === 0}
                  onClick={() => setSelectedSize(s.id)}
                  className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                    s.stock === 0 
                      ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed line-through' 
                      : selectedSize === s.id
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                        : 'bg-white border-gray-200 text-neutral-900 hover:border-indigo-600 hover:text-indigo-600'
                  }`}
                >
                  {s.size}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button 
              disabled={isOutOfStock || !selectedSize || addingToCart}
              onClick={addToCart}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex justify-center items-center gap-2 ${
                isOutOfStock || !selectedSize
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : addedToCart
                    ? 'bg-green-600 text-white shadow-lg hover:scale-[1.02]'
                    : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-xl shadow-neutral-200 hover:scale-[1.02]'
              }`}
            >
              {addedToCart ? <CheckCircle2 className="w-5 h-5" /> : (addingToCart ? <Loader2 className="w-5 h-5 animate-spin"/> : <ShoppingBag className="w-5 h-5" />)}
              {isOutOfStock ? 'Producto Agotado' : !selectedSize ? 'Selecciona una talla para añadir' : addedToCart ? '¡Añadido al Carrito!' : 'Añadir al Carrito'}
            </button>
            {session?.user?.role !== 'BUYER' && (
              <p className="text-center text-sm text-red-500 font-medium mt-3">
                Debes iniciar sesión con rol de comprador para usar el carrito.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Relacionados */}
      {related.length > 0 && (
        <div className="pt-16 border-t border-gray-100 space-y-8">
          <h2 className="text-2xl font-bold text-neutral-900">También podría interesarte</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {related.map(p => (
              <Link href={`/catalog/${p.id}`} key={p.id} className="group flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                  {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <ShoppingBag className="w-8 h-8 text-gray-300 m-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                  <p className="text-sm font-semibold text-gray-500">${p.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
