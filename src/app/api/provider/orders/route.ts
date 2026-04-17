import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { censorAbusiveLanguage } from "@/lib/moderation";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !["PROVIDER", "ADMIN"].includes(session.user.role) || session.user.isBanned) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where = session.user.role === "ADMIN" ? {} : { providerId: session.user.id };

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      service: { select: { id: true, name: true, icon: true } },
      review: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const sanitizedOrders = orders.map((order) => ({
    ...order,
    review: order.review
      ? {
          ...order.review,
          comment: censorAbusiveLanguage(order.review.comment),
        }
      : null,
  }));

  return NextResponse.json(sanitizedOrders);
}
