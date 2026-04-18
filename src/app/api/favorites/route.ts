import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "BUYER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: { sizes: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error("GET Favorites Error:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "BUYER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "Falta productId" }, { status: 400 });

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productId
        }
      }
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ action: "removed", productId });
    } else {
      await prisma.favorite.create({
        data: {
          userId: session.user.id,
          productId: productId
        }
      });
      return NextResponse.json({ action: "added", productId });
    }
  } catch (error) {
    console.error("POST Favorites Error:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}
