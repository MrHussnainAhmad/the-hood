import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

async function deleteServiceReviews(serviceId: string) {
  const orders = await prisma.order.findMany({
    where: { serviceId },
    select: { id: true },
  });

  if (orders.length === 0) return 0;

  const result = await prisma.review.deleteMany({
    where: {
      orderId: { in: orders.map((order) => order.id) },
    },
  });

  return result.count;
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ serviceId: string }> }
) {
  const params = await props.params;
  
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.active === false) {
      await deleteServiceReviews(params.serviceId);
    }

    const service = await prisma.service.update({
      where: { id: params.serviceId },
      data: body,
    });

    return NextResponse.json(service);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ serviceId: string }> }
) {
  const params = await props.params;
  
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderCount = await prisma.order.count({
      where: { serviceId: params.serviceId },
    });

    if (orderCount > 0) {
      await deleteServiceReviews(params.serviceId);
      await prisma.service.update({
        where: { id: params.serviceId },
        data: { active: false },
      });
      return NextResponse.json({
        message: "Service archived and related reviews deleted because it has existing orders",
      });
    }

    await deleteServiceReviews(params.serviceId);
    await prisma.service.delete({ where: { id: params.serviceId } });
    return NextResponse.json({ message: "Service deleted and related reviews removed" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
