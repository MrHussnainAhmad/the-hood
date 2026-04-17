import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { censorAbusiveLanguage } from "@/lib/moderation";

function parseServicePrice(price: string | null | undefined) {
  if (!price) return null;
  const numeric = parseFloat(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

async function isLocationEligible(
  providerId: string | null | undefined,
  city: string | null | undefined,
  area: string | null | undefined,
  pincode: string | null | undefined
) {
  const normalizedCity = city?.trim();
  const normalizedPincode = pincode?.trim();
  const normalizedArea = area?.trim();

  if (!normalizedCity || !normalizedPincode) return false;

  const baseWhere = {
    active: true,
    city: {
      equals: normalizedCity,
      mode: "insensitive" as const,
    },
    pincode: normalizedPincode,
    ...(normalizedArea
      ? {
          area: {
            equals: normalizedArea,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  if (providerId) {
    const p = prisma as unknown as {
      providerLocation?: { findFirst: (args: unknown) => Promise<unknown> };
    };

    if (p.providerLocation) {
      const match = await p.providerLocation.findFirst({
        where: {
          providerId,
          ...baseWhere,
        },
      });
      return !!match;
    }
  }

  const fallbackMatch = await prisma.availableLocation.findFirst({
    where: baseWhere,
  });
  return !!fallbackMatch;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.isBanned) {
      return NextResponse.json({ error: "Account is banned" }, { status: 403 });
    }
    if (session.user.role === "PROVIDER" || session.user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Only consumers can create orders" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      serviceId,
      address,
      city,
      area,
      pincode,
      description,
      scheduledDate,
      images,
    } = body;

    const safeImages = Array.isArray(images)
      ? images
          .filter(
            (img: unknown): img is string =>
              typeof img === "string" && /^https?:\/\//i.test(img)
          )
          .slice(0, 5)
      : [];

    // Validate required fields
    if (!serviceId || !address || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (!city || !pincode) {
      return NextResponse.json(
        { error: "City and pincode/zipcode are required" },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { providerId: true, active: true, price: true },
    });

    if (!service || !service.active) {
      return NextResponse.json({ error: "Service not available" }, { status: 404 });
    }
    if (!service.providerId) {
      return NextResponse.json(
        { error: "This service is currently unavailable for booking" },
        { status: 400 }
      );
    }
    const amount = parseServicePrice(service.price);
    if (!amount) {
      return NextResponse.json(
        { error: "Service price is not configured correctly" },
        { status: 400 }
      );
    }

    const locationEligible = await isLocationEligible(
      service.providerId,
      city,
      area,
      pincode
    );

    if (!locationEligible) {
      return NextResponse.json(
        { error: "Service not available for this location" },
        { status: 400 }
      );
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        providerId: service.providerId,
        serviceId,
        address,
        city,
        area,
        pincode,
        description,
        amount,
        currency: "usd",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        images: safeImages,
        status: "PROCESSING",
      },
      include: {
        service: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "PROVIDER" || session.user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Only consumers can use this endpoint" },
        { status: 403 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        service: true,
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
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
