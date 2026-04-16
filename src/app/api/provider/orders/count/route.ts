import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PROVIDER" || session.user.isBanned) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await prisma.order.count({
      where: {
        providerId: session.user.id,
        status: "PROCESSING",
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Provider order count fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch provider order count" },
      { status: 500 }
    );
  }
}

