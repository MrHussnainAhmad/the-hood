import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getPlatformFeePercent } from "@/lib/platform-fee";
import { renderPaymentConfirmationEmail, sendEmail } from "@/lib/email";

export async function POST(
  request: Request,
  props: { params: Promise<{ orderId: string }> }
) {
  const params = await props.params;

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json({ error: "Payment intent ID is required" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: params.orderId,
        userId: session.user.id,
      },
      select: {
        id: true,
        paymentIntentId: true,
        amount: true,
        currency: true,
        status: true,
        provider: {
          select: {
            providerEmployeeRange: true,
          },
        },
        user: {
          select: { email: true, name: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentIntentId !== paymentIntentId) {
      return NextResponse.json({ error: "Payment reference mismatch" }, { status: 400 });
    }

    const amount = order.amount || 0;
    const platformFeePercent = getPlatformFeePercent(
      order.provider?.providerEmployeeRange
    );
    const platformFee = Number(((amount * platformFeePercent) / 100).toFixed(2));
    const providerPayoutAmount = Number((amount - platformFee).toFixed(2));

    try {
      await prisma.order.update({
        where: { id: params.orderId },
        data: {
          paymentStatus: "PAID",
          platformFee,
          providerPayoutAmount,
          payoutStatus: order.status === "COMPLETED" ? "READY" : "UNPAID",
        },
      });
    } catch (updateError: unknown) {
      const message =
        updateError instanceof Error ? updateError.message : String(updateError);

      // Backward-compat fallback: if Prisma client is stale and does not know payout fields yet,
      // still mark payment as PAID so checkout does not fail.
      if (message.includes("Unknown argument `platformFee`")) {
        await prisma.order.update({
          where: { id: params.orderId },
          data: {
            paymentStatus: "PAID",
          },
        });
      } else {
        throw updateError;
      }
    }

    if (order.user?.email) {
      await sendEmail({
        to: order.user.email,
        subject: "Payment confirmed - The Hood",
        html: renderPaymentConfirmationEmail({
          name: order.user.name || "there",
          orderId: order.id,
          amount,
          currency: order.currency || "usd",
        }),
      }).catch((error) => console.error("Payment confirmation email error:", error));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment confirm error:", error);
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 });
  }
}
