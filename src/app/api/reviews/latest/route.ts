import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { censorAbusiveLanguage } from "@/lib/moderation";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const maxReviews = session ? 6 : 4;

    const reviews = await prisma.review.findMany({
      take: maxReviews,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        order: {
          select: {
            service: {
              select: {
                name: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    const sanitizedReviews = reviews.map((review) => ({
      ...review,
      comment: censorAbusiveLanguage(review.comment),
    }));

    return NextResponse.json(sanitizedReviews);
  } catch (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
