import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { city, area, pincode, serviceId } = body;

    if (!city?.trim() || !pincode?.trim()) {
      return NextResponse.json(
        { error: "City and pincode/zipcode are required" },
        { status: 400 }
      );
    }

    const normalizedCity = String(city).trim();
    const normalizedPincode = String(pincode).trim();
    const normalizedArea = typeof area === "string" ? area.trim() : "";

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

    let location: unknown = null;

    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { providerId: true },
      });

      if (service?.providerId) {
        const p = prisma as unknown as {
          providerLocation?: { findFirst: (args: unknown) => Promise<unknown> };
        };

        if (p.providerLocation) {
          location = await p.providerLocation.findFirst({
            where: {
              providerId: service.providerId,
              ...baseWhere,
            },
          });
        } else {
          location = await prisma.availableLocation.findFirst({ where: baseWhere });
        }
      } else {
        location = await prisma.availableLocation.findFirst({ where: baseWhere });
      }
    } else {
      location = await prisma.availableLocation.findFirst({ where: baseWhere });
    }

    return NextResponse.json({
      available: !!location,
      location: location || null,
    });
  } catch (error) {
    console.error("Location check error:", error);
    return NextResponse.json(
      { error: "Failed to check location" },
      { status: 500 }
    );
  }
}
