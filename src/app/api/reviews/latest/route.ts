import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { censorAbusiveLanguage } from "@/lib/moderation";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const maxReviews = session ? 6 : 4;

    const [reviews, aggregate] = await Promise.all([
      prisma.review.findMany({
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
      }),
      prisma.review.aggregate({
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const sanitizedReviews = reviews.map((review: (typeof reviews)[number]) => ({
      ...review,
      comment: censorAbusiveLanguage(review.comment),
    }));

    return NextResponse.json({
      latestReviews: sanitizedReviews,
      averageRating: aggregate._avg.rating ?? 0,
      totalReviews: aggregate._count.rating ?? 0,
    });
  } catch (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
