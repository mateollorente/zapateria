"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Link as LinkIcon, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "URBAN",
  });

  const [images, setImages] = useState<string[]>([""]);
  const [sizes, setSizes] = useState<{ size: string; stock: string }[]>([
    { size: "", stock: "" }
  ]);

  useEffect(() => {
    // Fetch product details
    const fetchProduct = async () => {
      try {
        const res = await fetch("/api/seller/products");
        const data = await res.json();
        const product = data.find((p: any) => p.id === id);
        
        if (product) {
          setForm({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            category: product.category,
          });
          
          if (product.images && product.images.length > 0) {
            setImages(product.images);
          }
          
          if (product.sizes && product.sizes.length > 0) {
            setSizes(product.sizes.map((s: any) => ({ size: s.size, stock: s.stock.toString() })));
          }
        } else {
          setError("Producto no encontrado");
        }
      } catch (e) {
        setError("Error de conexión");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        images: images.filter(i => i.trim() !== ""),
        sizes: sizes.filter(s => s.size.trim() !== "" && s.stock.trim() !== ""),
      };

      const res = await fetch(`/api/seller/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/seller");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Ocurrió un error al guardar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-12">
      <div className="flex items-center gap-4">
        <Link href="/seller" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Editar Zapatilla</h1>
          <p className="text-sm text-gray-500">Actualiza la información de {form.name || "tu producto"}.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium text-sm">
          {error}
        </div>
      )}

      {/* Reutilizando el mismo layout del form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-lg font-bold text-neutral-900 border-b border-gray-100 pb-2">Datos Principales</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Nombre del Zapato</label>
              <input
                required
                type="text"
                placeholder="Ej. Nike Air Max, Botas de Cuero..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Precio (USD)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Categoría</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="URBAN">Urbano</option>
                <option value="SPORT">Deportivo</option>
                <option value="FORMAL">Formal</option>
                <option value="SANDALS">Sandalias</option>
                <option value="BOOTS">Botas</option>
              </select>
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Descripción detallada</label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <h2 className="text-lg font-bold text-neutral-900">Variantes y Stock</h2>
            <button
              type="button"
              onClick={() => setSizes([...sizes, { size: "", stock: "" }])}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Agregar Variante
            </button>
          </div>

          <div className="space-y-4">
            {sizes.map((s, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Talle</label>
                  <input
                    placeholder="Ej. 39, US 9, M..."
                    required
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={s.size}
                    onChange={(e) => {
                      const newSizes = [...sizes];
                      newSizes[idx].size = e.target.value;
                      setSizes(newSizes);
                    }}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Stock (Pares)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Cantidad"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={s.stock}
                    onChange={(e) => {
                      const newSizes = [...sizes];
                      newSizes[idx].stock = e.target.value;
                      setSizes(newSizes);
                    }}
                  />
                </div>
                {sizes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSizes(sizes.filter((_, i) => i !== idx))}
                    className="mt-5 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 space-y-6">
           <div className="flex justify-between border-b border-gray-100 pb-2">
            <h2 className="text-lg font-bold text-neutral-900">Imágenes (URLs)</h2>
            <button
              type="button"
              onClick={() => setImages([...images, ""])}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Añadir Foto
            </button>
          </div>
          
          <div className="space-y-4">
            {images.map((img, idx) => (
              <div key={idx} className="flex gap-4 items-center">
                <input
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={img}
                  onChange={(e) => {
                    const newImgs = [...images];
                    newImgs[idx] = e.target.value;
                    setImages(newImgs);
                  }}
                />
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/seller"
            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Actualizar Zapatilla
          </button>
        </div>
      </form>
    </div>
  );
}
