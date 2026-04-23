import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function verifyMercadoPagoSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;

  const [ts, hash] = signature.split(",");
  const tsValue = ts?.replace("t=", "");
  const expectedHash = hash?.replace("v1=", "");

  if (!tsValue || !expectedHash) return false;

  const localHash = crypto
    .createHmac("sha256", secret)
    .update(body + tsValue)
    .digest("hex");

  return localHash === expectedHash;
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let body: any;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const signature = req.headers.get("x-signature") || "";
    const mpSecret = process.env.MP_WEBHOOK_SECRET || "";

    if (mpSecret && signature && process.env.NODE_ENV === "production") {
      if (!verifyMercadoPagoSignature(rawBody, signature, mpSecret)) {
        console.warn("MercadoPago webhook signature verification failed");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const paymentId =
      body.data?.id ||
      body.id ||
      body.data?.object?.id ||
      body.object?.id;

    const topic =
      body.topic ||
      body.type ||
      body.action;

    const isPaymentTopic =
      topic === "payment" ||
      topic === "payments" ||
      body.action?.startsWith("payment") ||
      body.type === "payment";

    if (!isPaymentTopic) {
      return NextResponse.json({ success: true, msg: "Ignored topic" });
    }

    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    if (!process.env.MP_ACCESS_TOKEN) {
      console.error("MP_ACCESS_TOKEN not configured");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const { MercadoPagoConfig, Payment } = await import("mercadopago");
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const paymentInfo = new Payment(client);

    let paymentData;
    try {
      paymentData = await paymentInfo.get({ id: Number(paymentId) });
    } catch (mpError: any) {
      console.error("Failed to fetch payment from MP:", mpError?.message);
      return NextResponse.json({ error: "Failed to verify payment" }, { status: 502 });
    }

    const orderId = paymentData.external_reference;

    if (!orderId) {
      console.error("No external_reference found for payment", paymentId);
      return NextResponse.json({ error: "No order reference" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      console.error("Order not found:", orderId);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "PAID") {
      return NextResponse.json({ success: true, msg: "Order already processed" });
    }

    if (paymentData.status === "approved") {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PAID",
          mpPaymentId: String(paymentData.id)
        }
      });

      console.log(`Order ${orderId} confirmed - payment approved`);
      return NextResponse.json({ success: true, status: "PAID" });

    } else if (
      paymentData.status === "rejected" ||
      paymentData.status === "cancelled" ||
      paymentData.status === "refunded"
    ) {
      await prisma.$transaction(async (tx: any) => {
        for (const item of order.items) {
          const sizeRecord = await tx.productSize.findFirst({
            where: {
              productId: item.productId,
              size: item.size
            }
          });

          if (sizeRecord) {
            await tx.productSize.update({
              where: { id: sizeRecord.id },
              data: { stock: { increment: item.quantity } }
            });
          }
        }

        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" }
        });
      });

      console.log(`Order ${orderId} cancelled - stock rolled back`);
      return NextResponse.json({ success: true, status: "CANCELLED" });
    }

    return NextResponse.json({ success: true, status: paymentData.status });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ msg: "MercadoPago Webhook endpoint" });
}