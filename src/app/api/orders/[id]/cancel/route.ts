import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const orderId = params.id;

    // Buscar la orden asegurando que es del usuario y que está en PENDING
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (order.buyerId !== session.user.id) {
       return NextResponse.json({ error: "No autorizado para esta orden" }, { status: 403 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Solo se pueden cancelar órdenes pendientes" }, { status: 400 });
    }

    // Usar una transacción para cancelar y devolver stock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await prisma.$transaction(async (tx: any) => {
      // Marcar orden como cancelada
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" }
      });

      // Retornar las unidades al stock real
      for (const item of order.items) {
        const sizeRef = await tx.productSize.findFirst({
          where: {
            productId: item.productId,
            size: item.size
          }
        });

        if (sizeRef) {
           await tx.productSize.update({
             where: { id: sizeRef.id },
             data: { stock: { increment: item.quantity } }
           });
        }
      }
    });

    return NextResponse.json({ success: true, message: "Orden cancelada correctamente." });

  } catch (error) {
    console.error("Cancel Order API Error:", error);
    return NextResponse.json({ error: "Error en el servidor al cancelar la orden" }, { status: 500 });
  }
}
