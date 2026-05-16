import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { censorAbusiveLanguage } from "@/lib/moderation";
import { renderServiceDeliveredEmail, sendEmail } from "@/lib/email";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  const params = await props.params;
  
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    const updateData: any = { status };

    // Set completedDate when status changes to COMPLETED
    if (status === "COMPLETED") {
      updateData.completedDate = new Date();
    }

    const order = await prisma.order.update({
      where: { id: params.orderId },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        service: true,
      },
    });

    if (status === "COMPLETED" && order.user?.email) {
      await sendEmail({
        to: order.user.email,
        subject: "Service delivered - The Hood",
        html: renderServiceDeliveredEmail({
          name: order.user.name || "there",
          orderId: order.id,
          serviceName: order.service?.name || "Service",
        }),
      }).catch((error) => console.error("Admin service delivered email error:", error));
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  const params = await props.params;
  
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        service: true,
        review: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user is authorized to view this order
    if (
      session.user.role !== "ADMIN" &&
      session.user.id !== order.userId
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sanitizedOrder = {
      ...order,
      review: order.review
        ? {
            ...order.review,
            comment: censorAbusiveLanguage(order.review.comment),
          }
        : null,
    };

    return NextResponse.json(sanitizedOrder);
  } catch (error) {
    console.error("Order fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
