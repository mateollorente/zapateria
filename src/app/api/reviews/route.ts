import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "BUYER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { productId, rating, comment } = await req.json();
    if (!productId || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Datos de reseña inválidos" }, { status: 400 });
    }

    // Checking if user has PAID order for this productId
    const hasBought = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { buyerId: session.user.id, status: "PAID" }
      }
    });

    if (!hasBought) {
      return NextResponse.json({ error: "Solo puedes opinar después de concretar la compra de este modelo." }, { status: 403 });
    }

    // Upsert review
    const upserted = await prisma.review.upsert({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId
        }
      },
      update: { rating, comment },
      create: {
        userId: session.user.id,
        productId,
        rating,
        comment
      }
    });

    return NextResponse.json(upserted);

  } catch (error) {
    console.error("POST Review Error", error);
    return NextResponse.json({ error: "Error de servidor al guardar la reseña" }, { status: 500 });
  }
}
