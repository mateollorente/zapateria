import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await context.params;
    
    // Para ver si el usuario puede dejar review
    const session = await getServerSession(authOptions);
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        sizes: true,
        seller: {
          select: { id: true, name: true, email: true }
        },
        reviews: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    // Comprobamos si tiene permitido opinar
    let canReview = false;
    let existingReview = null;
    if (session?.user?.role === "BUYER") {
       const bought = await prisma.orderItem.findFirst({
         where: { productId, order: { buyerId: session.user.id, status: "PAID" } }
       });
       canReview = !!bought;
       
       existingReview = product.reviews.find(r => r.userId === session.user.id) || null;
    }

    // Computar Promedio de la Zapatilla
    const avgScore = product.reviews.length > 0 
      ? product.reviews.reduce((a, b) => a + b.rating, 0) / product.reviews.length 
      : 0;

    // Computar Promedio Histórico del Vendedor
    const sellerReviews = await prisma.review.findMany({
      where: { product: { sellerId: product.seller.id } }
    });
    const sellerAvgScore = sellerReviews.length > 0 
      ? sellerReviews.reduce((a, b) => a + b.rating, 0) / sellerReviews.length 
      : 0;

    const related = await prisma.product.findMany({
      where: { category: product.category, id: { not: product.id } },
      take: 3,
      include: { sizes: true, reviews: { select: { rating: true } } }
    });

    return NextResponse.json({ 
      product, 
      related, 
      canReview,
      existingReview,
      avgScore,
      sellerAvgScore,
      totalSellerReviews: sellerReviews.length
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
