import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("BODY:", body);

    const { email, password, name, role } = body;

    if (!email || !password) {
      return new Response("Faltan email o password", { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    return Response.json(user);
  } catch (error) {
    console.error("ERROR REGISTER:", error);
    return new Response("Error en el servidor", { status: 500 });
  }
}
