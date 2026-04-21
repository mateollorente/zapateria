import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPagoConfig, { Payment } from "mercadopago";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body: any = await req.json().catch(() => null);

    let paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
    
    if (!paymentId && body && body.data && body.data.id) {
      paymentId = body.data.id;
    }
    if (!paymentId && body && body.id) {
      paymentId = body.id;
    }

    // MP envía "type=payment" en querystring, o "type": "payment" / "action": "payment.created" en el body.
    const isPaymentTopic = 
      url.searchParams.get("type") === "payment" || 
      url.searchParams.get("topic") === "payment" || 
      body?.type === "payment" || 
      body?.action?.startsWith("payment");

    if (isPaymentTopic && paymentId) {
      if (!process.env.MP_ACCESS_TOKEN) return NextResponse.json({ error: "Missing config" }, { status: 500 });
      
      const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
      const paymentInfo = new Payment(client);
      
      const paymentData = await paymentInfo.get({ id: paymentId });
      const orderId = paymentData.external_reference;

      if (!orderId) {
        return NextResponse.json({ error: "No external reference" }, { status: 400 });
      }

      if (paymentData.status === "approved") {
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            status: "PAID",
            mpPaymentId: String(paymentData.id) 
          }
        });
      } else if (paymentData.status === "rejected" || paymentData.status === "cancelled") {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" }
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true, msg: "Ignored topic" });
    
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
