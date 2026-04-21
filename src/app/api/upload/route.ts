import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const formData = await req.formData();
    // Leer los archivos. El frontend enviará los archivos con la key "images"
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No se enviaron archivos" }, { status: 400 });
    }

    const uploadedPaths: string[] = [];
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // Asegurar que el directorio exista
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignorar si ya existe
    }

    for (const file of files) {
      if (!file.name) continue;
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generar nombre seguro y único
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${sanitizedName}`;
      const filePath = path.join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      
      // Guardar la URL pública
      uploadedPaths.push(`/uploads/${fileName}`);
    }

    return NextResponse.json({ urls: uploadedPaths }, { status: 201 });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Error en el servidor al subir la imagen" }, { status: 500 });
  }
}
