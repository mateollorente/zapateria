import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id: productId } = await context.params;
    const body = await req.json();
    const { name, description, price, category, images, sizes } = body;

    // Verificar propiedad
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing || existing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "No encontrado o sin permiso" }, { status: 404 });
    }

    // Actualizar producto y reconstruir talles enteros
    await prisma.productSize.deleteMany({ where: { productId } });

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description,
        price: parseFloat(price.toString()),
        category,
        images: images || [],
        sizes: {
          create: sizes?.map((s: any) => ({
            size: s.size,
            stock: parseInt(s.stock.toString(), 10),
          })) || [],
        },
      },
      include: { sizes: true }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("PUT Product Error:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id: productId } = await context.params;
    
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing || existing.sellerId !== session.user.id) {
      return NextResponse.json({ error: "No encontrado o sin permiso" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Product Error:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
