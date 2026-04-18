"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    console.log("LOGIN:", form);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false, // importante para debug
    });

    console.log("RES:", res);

    if (res?.ok) {
      alert("Login correcto");
    } else {
      alert("Error en login");
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

      <button type="submit">Login</button>
    </form>
  );
}
