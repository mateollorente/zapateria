import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      where: { sellerId: session.user.id },
      include: { sizes: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET Products Error:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, price, category, images, sizes } = body;

    if (!name || !description || !price || !category) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price.toString()),
        category,
        images: images || [],
        sellerId: session.user.id,
        sizes: {
          create: sizes?.map((s: any) => ({
            size: s.size,
            stock: parseInt(s.stock.toString(), 10),
          })) || [],
        },
      },
      include: { sizes: true }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST Product Error:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
