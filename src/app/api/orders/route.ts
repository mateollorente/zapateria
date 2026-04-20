import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      where: session.user.role === "BUYER" ? { buyerId: session.user.id } : {}, 
      include: {
        items: {
          include: {
            product: {
              select: { name: true, images: true, category: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET Orders Error", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "BUYER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderResult = await prisma.$transaction(async (tx: any) => {
      
      // 1. Encontrar carrito
      const cart = await tx.cart.findUnique({
        where: { userId: session.user.id },
        include: {
          items: {
            include: {
              productSize: {
                include: { product: true }
              }
            }
          }
        }
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("El carrito está vacío");
      }

      // 2. Validar existencias de stock REAL en el milisegundo de la transacción
      for (const item of cart.items) {
        if (item.quantity > item.productSize.stock) {
          throw new Error(`Stock insuficiente para ${item.productSize.product.name} talla ${item.productSize.size}`);
        }
      }

      const totalAmount = cart.items.reduce((acc: number, item: any) => acc + (item.quantity * item.productSize.product.price), 0);

      // 3. Crear cabecera de Orden (Mocked as PAID for Day 7 to simulate stock deduct, will change with MP in Day 8)
      const newOrder = await tx.order.create({
        data: {
          buyerId: session.user.id,
          total: totalAmount,
          status: "PAID",
          items: {
            create: cart.items.map((item: any) => ({
              productId: item.productSize.productId,
              size: item.productSize.size,
              quantity: item.quantity,
              price: item.productSize.product.price // Snapshot temporal del precio de hoy
            }))
          }
        }
      });

      // 4. Descontar Inventario Global
      for (const item of cart.items) {
        await tx.productSize.update({
          where: { id: item.productSizeId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      // 5. Vaciar canasta de compras
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id }
      });

      return newOrder;
    });

    return NextResponse.json({ success: true, orderId: orderResult.id });

  } catch (error: any) {
    console.error("POST Order Transaction Error:", error);
    return NextResponse.json({ error: error.message || "Error intero al procesar pago" }, { status: 400 });
  }
}
