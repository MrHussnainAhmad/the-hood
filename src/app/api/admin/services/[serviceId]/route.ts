import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { renderProviderServiceRemovedEmail, sendEmail } from "@/lib/email";

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

    const body = await request.json().catch(() => ({}));
    const deletionReason =
      typeof body?.reason === "string" && body.reason.trim().length > 0
        ? body.reason.trim()
        : null;

    const existing = await prisma.service.findUnique({
      where: { id: params.serviceId },
      select: { id: true, active: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // First delete click: deactivate and keep record for a second confirmation click.
    if (existing.active) {
      const updated = await prisma.service.update({
        where: { id: params.serviceId },
        data: {
          active: false,
          adminDeletionReason: deletionReason,
          adminDeactivatedAt: new Date(),
          providerDeletionNoticeSeenAt: null,
        },
        include: {
          provider: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      if (updated.provider?.email) {
        await sendEmail({
          to: updated.provider.email,
          subject: "Service removed by admin - The Hood",
          html: renderProviderServiceRemovedEmail({
            providerName: updated.provider.name || "Provider",
            serviceName: updated.name,
            reason: deletionReason,
          }),
        }).catch((error) => console.error("Provider service removed email error:", error));
      }

      return NextResponse.json({
        message:
          "Service deactivated. Click delete again to permanently remove it from database.",
      });
    }

    // Second delete click: hard delete service and all dependent records.
    const orders = await prisma.order.findMany({
      where: { serviceId: params.serviceId },
      select: { id: true },
    });
    const orderIds = orders.map((order: (typeof orders)[number]) => order.id);

    if (orderIds.length > 0) {
      await prisma.review.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      await prisma.payment.deleteMany({
        where: { orderId: { in: orderIds } },
      });
      await prisma.order.deleteMany({
        where: { id: { in: orderIds } },
      });
    }

    await prisma.service.delete({ where: { id: params.serviceId } });
    return NextResponse.json({ message: "Service permanently deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
