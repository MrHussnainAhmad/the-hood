import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function canManageServices(role: string) {
  return role === "PROVIDER" || role === "ADMIN";
}

async function upsertProviderLocation(
  providerId: string,
  city: string,
  area: string | null,
  pincode: string | null
) {
  const p = prisma as unknown as {
    providerLocation?: {
      findFirst: (args: unknown) => Promise<unknown>;
      create: (args: unknown) => Promise<unknown>;
    };
  };

  if (p.providerLocation) {
    const existing = await p.providerLocation.findFirst({
      where: {
        providerId,
        city: { equals: city, mode: "insensitive" },
        ...(area && { area: { equals: area, mode: "insensitive" } }),
        ...(pincode && { pincode }),
      },
    });

    if (!existing) {
      await p.providerLocation.create({
        data: { providerId, city, area, pincode, active: true },
      });
    }
    return;
  }

  const fallbackExisting = await prisma.availableLocation.findFirst({
    where: {
      active: true,
      city: { equals: city, mode: "insensitive" },
      ...(area && { area: { equals: area, mode: "insensitive" } }),
      ...(pincode && { pincode }),
    },
  });

  if (!fallbackExisting) {
    await prisma.availableLocation.create({
      data: { city, area, pincode, active: true },
    });
  }
}

async function activateProviderLocations(providerId: string, locationIds: string[]) {
  if (!locationIds.length) return;

  const p = prisma as unknown as {
    providerLocation?: {
      updateMany: (args: unknown) => Promise<unknown>;
    };
  };

  if (p.providerLocation) {
    await p.providerLocation.updateMany({
      where: {
        providerId,
        id: { in: locationIds },
      },
      data: { active: true },
    });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !canManageServices(session.user.role) || session.user.isBanned) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const where = session.user.role === "ADMIN" ? {} : { providerId: session.user.id };

  const services = await prisma.service.findMany({
    where,
    include: {
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(services);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !canManageServices(session.user.role) || session.user.isBanned) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, icon, price, active, serviceAreas, serviceArea, selectedLocationIds } = body;

  if (!name || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const locations = Array.isArray(serviceAreas)
    ? serviceAreas
    : serviceArea
    ? [serviceArea]
    : [];
  const selectedIds = Array.isArray(selectedLocationIds)
    ? selectedLocationIds.filter((id: unknown): id is string => typeof id === "string" && id.trim().length > 0)
    : [];

  if (session.user.role === "PROVIDER") {
    const hasNewLocations = locations.some((loc) => typeof loc?.city === "string" && loc.city.trim().length > 0);
    if (!hasNewLocations && selectedIds.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one existing location or add a new one" },
        { status: 400 }
      );
    }
  }

  const service = await prisma.service.create({
    data: {
      name,
      description,
      icon,
      price,
      active: active ?? true,
      providerId: session.user.role === "ADMIN" ? body.providerId ?? null : session.user.id,
    },
  });

  if (session.user.role === "PROVIDER") {
    await activateProviderLocations(session.user.id, selectedIds);

    for (const loc of locations) {
      const city = loc?.city?.trim();
      const area = loc?.area?.trim() || null;
      const pincode = loc?.pincode?.trim() || null;
      if (!city) continue;
      await upsertProviderLocation(session.user.id, city, area, pincode);
    }
  }

  return NextResponse.json(service, { status: 201 });
}
