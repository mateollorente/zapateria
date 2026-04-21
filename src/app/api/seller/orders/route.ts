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

    // Buscar todos los items de órdenes que pertenecen a este vendedor
    const items = await prisma.orderItem.findMany({
      where: {
        product: { sellerId: session.user.id },
      },
      include: {
        order: {
          include: {
            buyer: {
              select: { name: true, email: true }
            }
          }
        },
        product: true
      },
      orderBy: {
        order: { createdAt: "desc" }
      }
    });

    // Formatear los datos para el frontend agrupándolos por orden o dejándolos planos
    // Dejaremos una lista de sub-ordenes desde la perspectiva del vendedor
    const sales = items.map((item: any) => ({
      id: item.id,
      orderId: item.orderId,
      status: item.order.status,
      date: item.order.createdAt,
      buyer: item.order.buyer,
      product: {
        id: item.product.id,
        name: item.product.name,
        category: item.product.category,
        image: item.product.images[0] || null,
      },
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity
    }));

    return NextResponse.json(sales);
  } catch (error) {
    console.error("GET Seller Orders Error:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
