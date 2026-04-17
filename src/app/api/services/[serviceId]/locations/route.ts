import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    serviceId: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { serviceId } = await params;

  try {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { providerId: true, active: true },
    });

    if (!service || !service.active || !service.providerId) {
      return NextResponse.json([]);
    }

    const p = prisma as unknown as {
      providerLocation?: {
        findMany: (args: unknown) => Promise<
          Array<{
            id: string;
            city: string;
            area: string | null;
            pincode: string | null;
            active: boolean;
          }>
        >;
      };
    };

    if (p.providerLocation) {
      const providerLocations = await p.providerLocation.findMany({
        where: { providerId: service.providerId, active: true },
        orderBy: [{ city: "asc" }, { area: "asc" }],
      });

      return NextResponse.json(providerLocations);
    }

    const fallbackLocations = await prisma.availableLocation.findMany({
      where: { active: true },
      orderBy: [{ city: "asc" }, { area: "asc" }],
      take: 100,
    });

    return NextResponse.json(fallbackLocations);
  } catch (error) {
    console.error("Service coverage fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch service coverage" },
      { status: 500 }
    );
  }
}
