import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await context.params;
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        sizes: true,
        seller: {
          select: { name: true, email: true }
        },
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    // Busquemos 3 productos relacionados de la misma categoría
    const related = await prisma.product.findMany({
      where: { category: product.category, id: { not: product.id } },
      take: 3,
      include: { sizes: true }
    });

    return NextResponse.json({ product, related });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
