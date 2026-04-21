import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "BUYER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      throw new Error("El Vendedor no ha configurado MercadoPago actualmente (MP_ACCESS_TOKEN)");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderPayload = await prisma.$transaction(async (tx: any) => {
      const cart = await tx.cart.findUnique({
        where: { userId: session.user.id },
        include: {
          items: { include: { productSize: { include: { product: true } } } }
        }
      });

      if (!cart || cart.items.length === 0) throw new Error("El carrito está vacío");

      for (const item of cart.items) {
        if (item.quantity > item.productSize.stock) {
          throw new Error(`Stock insuficiente para ${item.productSize.product.name} (Talla ${item.productSize.size})`);
        }
      }

      const totalAmount = cart.items.reduce((acc: number, item: any) => acc + (item.quantity * item.productSize.product.price), 0);

      const newOrder = await tx.order.create({
        data: {
          buyerId: session.user.id,
          total: totalAmount,
          status: "PENDING", // Se mantendrá PENDING hasta que MP mande el webhook de Success
          items: {
            create: cart.items.map((item: any) => ({
              productId: item.productSize.productId,
              size: item.productSize.size,
              quantity: item.quantity,
              price: item.productSize.product.price 
            }))
          }
        }
      });

      // Descontamos el stock para reservarlo.
      for (const item of cart.items) {
        await tx.productSize.update({
          where: { id: item.productSizeId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return { newOrder, cartItems: cart.items };
    });

    // ======= INTEGRACIÓN MERCADO PAGO =======
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN, options: { timeout: 5000 } });
    const preference = new Preference(client);
    
    // Auto-detectamos la baseUrl para el callback (Válido en local y en VPS productivo)
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";   
    const baseUrl = `${protocol}://${host}`;

    const itemsForMP = orderPayload.cartItems.map((item: any) => ({
       id: item.productSize.productId,
       title: item.productSize.product.name + ` (Talla: ${item.productSize.size})`,
       quantity: item.quantity,
       unit_price: item.productSize.product.price,
       currency_id: 'ARS',
    }));

    const prefResponse = await preference.create({
      body: {
        items: itemsForMP,
        external_reference: orderPayload.newOrder.id,
        back_urls: {
          success: `${baseUrl}/orders`,
          pending: `${baseUrl}/orders`,
          failure: `${baseUrl}/cart`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/webhooks/mp`,
        statement_descriptor: "MUNDO ZAPATERIA"
      }
    });

    // Guardamos la referencia de MP creada en nuestra Db
    await prisma.order.update({
      where: { id: orderPayload.newOrder.id },
      data: { mpPreferenceId: prefResponse.id }
    });

    return NextResponse.json({ success: true, init_point: prefResponse.init_point });

  } catch (error: any) {
    console.error("POST Checkout MP Error:", error);
    return NextResponse.json({ error: error.message || "Fallo en la comunicación con la Pasarela de Pago" }, { status: 400 });
  }
}
