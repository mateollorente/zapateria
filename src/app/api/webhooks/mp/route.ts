import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPagoConfig, { Payment } from "mercadopago";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const dataId = url.searchParams.get("data.id");

    if (type === "payment" && dataId) {
      if (!process.env.MP_ACCESS_TOKEN) return NextResponse.json({ error: "Missing config" }, { status: 500 });
      
      const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
      const paymentInfo = new Payment(client);
      
      // Consultamos en MP el estado real del pago que nos notifican
      const paymentData = await paymentInfo.get({ id: dataId });
      
      const orderId = paymentData.external_reference; // Éste es nuestro ID de Postgres "cuid"
      if (!orderId) {
        return NextResponse.json({ error: "No external reference" }, { status: 400 });
      }

      if (paymentData.status === "approved") {
        // Marcamos la orden oficializada en DB
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            status: "PAID",
            mpPaymentId: String(paymentData.id) 
          }
        });
      } else if (paymentData.status === "rejected" || paymentData.status === "cancelled") {
        // En un Ecommerce maduro, aquí devolveríamos el stock iterando OrderItems...
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" }
        });
      }

      return NextResponse.json({ success: true });
    }

    // MercadoPago a veces envia topics en el request body
    const body = await req.json().catch(() => null);
    if (body?.action === "payment.created" || body?.type === "payment") {
       // ... Lógica espejada para SDK moderno si cambia la forma del body ...
       return NextResponse.json({ success: true, msg: "Reconocido por body" });
    }

    return NextResponse.json({ success: true }); // Siempre responder 200 para que MP no reintente
    
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
