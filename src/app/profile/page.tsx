"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { UserCircle, Mail, Key, ShieldCheck, Loader2, Save } from "lucide-react";

type ProfileData = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [nameInput, setNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setNameInput(data.name || "");
        }
      } catch (e) {} finally {
        setLoading(false);
      }
    };
    if (session) fetchProfile();
  }, [session]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput })
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        // Force NextAuth session refresh softly
        await update({ name: updated.name });
        alert("Identidad actualizada. Tus futuras valoraciones saldrán bajo este nombre.");
      } else {
        const err = await res.json();
        alert(err.error);
      }
    } catch {
      alert("Error de red");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 flex-1">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto w-full flex-1 pt-10 pb-16 animate-in fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200 shrink-0">
          <UserCircle className="w-10 h-10" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-900">Tu Perfil</h1>
          <p className="text-gray-500 font-medium">Configura tu identidad en la plataforma</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Correo Electrónico</p>
                <p className="font-semibold text-neutral-900">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Permisos de Cuenta</p>
                <p className="inline-flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider px-2 py-1 mt-1 rounded border bg-white shadow-sm border-gray-200">
                  <span className={`w-2 h-2 rounded-full ${profile.role === 'SELLER' ? 'bg-indigo-500' : 'bg-green-500'}`}></span>
                  {profile.role === 'SELLER' ? 'Vendedor Autorizado' : 'Comprador Standard'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Key className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Miembro desde</p>
                <p className="font-semibold text-neutral-900">{new Date(profile.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Nombre de Visualización Pública</label>
            <input 
              type="text" 
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-neutral-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              required
            />
            <p className="text-xs text-gray-500">Este nombre será visible cuando dejes reseñas en los productos.</p>
          </div>

          <button 
            type="submit" 
            disabled={isSaving || nameInput === profile.name}
            className="w-full flex justify-center items-center gap-2 py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />}
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
