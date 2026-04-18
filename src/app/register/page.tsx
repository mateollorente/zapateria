"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "BUYER",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    console.log("FORM ENVIADO:", form);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      alert("Usuario creado");
    } else {
      const text = await res.text();
      console.log(text);
      alert("Error al registrarse");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-10 flex flex-col gap-4">
      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) =>
          setForm({ ...form, email: e.target.value })
        }
      />

      <input
        placeholder="Password"
        type="password"
        value={form.password}
        onChange={(e) =>
          setForm({ ...form, password: e.target.value })
        }
      />

      <input
        placeholder="Nombre"
        value={form.name}
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />

      <select
        value={form.role}
        onChange={(e) =>
          setForm({ ...form, role: e.target.value })
        }
      >
        <option value="BUYER">Comprador</option>
        <option value="SELLER">Vendedor</option>
      </select>

      <button type="submit">Registrarse</button>
    </form>
  );
}
