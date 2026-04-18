import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "BUYER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const cart = await getOrCreateCart(session.user.id);
    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        productSize: {
          include: {
            product: {
              select: { id: true, name: true, price: true, images: true, category: true }
            }
          }
        }
      },
      orderBy: { id: "asc" }
    });

    return NextResponse.json(cartItems);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "BUYER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { productId, size } = await req.json();
    if (!productId || !size) return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });

    const cart = await getOrCreateCart(session.user.id);

    const productSizeObj = await prisma.productSize.findFirst({
      where: { productId, size }
    });

    if (!productSizeObj) {
      return NextResponse.json({ error: "Talla no encontrada" }, { status: 404 });
    }

    // Revisar si ya existe este productoSize en el carrito
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productSizeId: productSizeObj.id }
    });

    if (existing) {
      if (existing.quantity >= productSizeObj.stock) {
        return NextResponse.json({ error: "No hay más stock disponible de esta talla" }, { status: 400 });
      }
      
      const updated = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + 1 }
      });
      return NextResponse.json(updated);
    } else {
      if (productSizeObj.stock < 1) {
        return NextResponse.json({ error: "No hay stock de esta talla" }, { status: 400 });
      }

      const created = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productSizeId: productSizeObj.id,
          quantity: 1
        }
      });
      return NextResponse.json(created, { status: 201 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "BUYER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { itemId, action } = await req.json();
    
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true }
    });

    if (!item || item.cart.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado/No encontrado" }, { status: 404 });
    }

    const newQuantity = action === "increment" ? item.quantity + 1 : item.quantity - 1;
    
    if (newQuantity < 1) {
      await prisma.cartItem.delete({ where: { id: itemId } });
      return NextResponse.json({ deleted: true });
    } else {
      const updated = await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: newQuantity }
      });
      return NextResponse.json(updated);
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "BUYER") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    
    if (!itemId) return NextResponse.json({ error: "Falta itemId" }, { status: 400 });

    const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
    if (!item || item.cart.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
