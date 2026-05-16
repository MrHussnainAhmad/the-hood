import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function getServiceId(props: { params: Promise<{ serviceId: string }> }) {
  const params = await props.params;
  return params.serviceId;
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

async function deleteServiceReviews(serviceId: string) {
  const orders = await prisma.order.findMany({
    where: { serviceId },
    select: { id: true },
  });

  if (orders.length === 0) return 0;

  const result = await prisma.review.deleteMany({
    where: {
      orderId: { in: orders.map((order: (typeof orders)[number]) => order.id) },
    },
  });

  return result.count;
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ serviceId: string }> }
) {
  const session = await getServerSession(authOptions);
  const serviceId = await getServiceId(props);

  if (!session || session.user.isBanned || !["PROVIDER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  if (body?.acknowledgeAdminDeletionNotice === true) {
    const owned = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, providerId: true },
    });

    if (!owned) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    if (session.user.role !== "ADMIN" && owned.providerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const acknowledged = await prisma.service.update({
      where: { id: serviceId },
      data: { providerDeletionNoticeSeenAt: new Date() },
    });
    return NextResponse.json(acknowledged);
  }

  const { serviceAreas, serviceArea, selectedLocationIds, ...serviceData } = body;

  const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { providerId: true } });
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  if (session.user.role !== "ADMIN" && service.providerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (serviceData.active === false) {
    await deleteServiceReviews(serviceId);
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: serviceData,
  });

  const locations = Array.isArray(serviceAreas)
    ? serviceAreas
    : serviceArea
    ? [serviceArea]
    : [];
  const selectedIds = Array.isArray(selectedLocationIds)
    ? selectedLocationIds.filter((id: unknown): id is string => typeof id === "string" && id.trim().length > 0)
    : [];

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

  return NextResponse.json(updated);
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ serviceId: string }> }
) {
  const session = await getServerSession(authOptions);
  const serviceId = await getServiceId(props);

  if (!session || session.user.isBanned || !["PROVIDER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { providerId: true } });
  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  if (session.user.role !== "ADMIN" && service.providerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orderCount = await prisma.order.count({
    where: { serviceId },
  });

  if (orderCount > 0) {
    await deleteServiceReviews(serviceId);
    await prisma.service.update({
      where: { id: serviceId },
      data: { active: false },
    });
    return NextResponse.json({
      message: "Service archived and related reviews deleted because it has existing orders",
    });
  }

  await deleteServiceReviews(serviceId);
  await prisma.service.delete({ where: { id: serviceId } });
  return NextResponse.json({ message: "Service deleted and related reviews removed" });
}
