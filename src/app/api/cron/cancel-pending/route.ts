import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Calculamos 30 minutos (por defecto) hacia el pasado
    const timeLimitMinutes = 30;
    const expirationDate = new Date(Date.now() - timeLimitMinutes * 60 * 1000);

    // Buscar órdenes pendientes que pasaron del tiempo límite
    const expiredOrders = await prisma.order.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: expirationDate }
      },
      include: { items: true }
    });

    if (expiredOrders.length === 0) {
      return NextResponse.json({ message: "No hay órdenes expiradas" });
    }

    let cancelledCount = 0;

    // Utilizamos una iteración asíncrona sobre cada orden expirada para devolver el stock
    for (const order of expiredOrders) {
      await prisma.$transaction(async (tx: any) => {
        // En primer lugar marcamos la orden como CANCELADA
        await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" }
        });

        // Retornar las unidades al stock real usando transaction
        for (const item of order.items) {
          // Necesitamos encontrar el id exacto del ProductSize subyacente.
          // El esquema vinculó orderItems a Order y Product. El tamaño (item.size) fue guradado textual.
          // Debemos buscar la variante usando el 'productId' y 'size' combinados.
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
      cancelledCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se han cancelado y retornado el stock de ${cancelledCount} órdenes expiradas.` 
    });

  } catch (error) {
    console.error("Cancel Pending Cron Error:", error);
    return NextResponse.json({ error: "Error en servidor al procesar cancelaciones" }, { status: 500 });
  }
}
