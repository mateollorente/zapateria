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

    const orderItems = await prisma.orderItem.findMany({
      where: {
        product: { sellerId: session.user.id },
        order: { status: "PAID" } // Aseguramos tomar solo ventas reales o simuladas completadas
      },
      include: {
        product: { select: { name: true } },
        order: { select: { createdAt: true } }
      }
    });

    let totalRevenue = 0;
    let totalSales = 0;

    const salesByProductMap: Record<string, { name: string, quantity: number, revenue: number }> = {};

    for (const item of orderItems) {
      totalRevenue += (item.price * item.quantity);
      totalSales += item.quantity;

      if (!salesByProductMap[item.productId]) {
        salesByProductMap[item.productId] = { name: item.product.name, quantity: 0, revenue: 0 };
      }
      salesByProductMap[item.productId].quantity += item.quantity;
      salesByProductMap[item.productId].revenue += (item.price * item.quantity);
    }

    const salesByProduct = Object.values(salesByProductMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

    return NextResponse.json({
      totalSales,
      totalRevenue,
      salesByProduct
    });

  } catch (error) {
    console.error("Seller Stats Error:", error);
    return NextResponse.json({ error: "Error de servidor al compilar analíticas" }, { status: 500 });
  }
}
