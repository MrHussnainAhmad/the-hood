import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getPlatformFeePercent } from "@/lib/platform-fee";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "PROVIDER" || session.user.isBanned) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const provider = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { providerEmployeeRange: true },
  });
  const feePercent = getPlatformFeePercent(provider?.providerEmployeeRange);

  const orders = await prisma.order.findMany({
    where: {
      providerId: session.user.id,
      paymentStatus: "PAID",
    },
    select: {
      id: true,
      status: true,
      payoutStatus: true,
      payoutReleasedAt: true,
      amount: true,
      platformFee: true,
      providerPayoutAmount: true,
      completedDate: true,
      createdAt: true,
      service: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const summary = orders.reduce(
    (
      acc: { total: number; paid: number; ready: number; pending: number },
      order: (typeof orders)[number]
    ) => {
      const gross = order.amount || 0;
      const fee = order.platformFee ?? Number(((gross * feePercent) / 100).toFixed(2));
      const payout = order.providerPayoutAmount ?? Number((gross - fee).toFixed(2));
      const effectiveStatus =
        order.payoutStatus === "PAID"
          ? "PAID"
          : order.status === "COMPLETED"
          ? "READY"
          : "UNPAID";
      if (effectiveStatus === "PAID") acc.paid += payout;
      else if (effectiveStatus === "READY") acc.ready += payout;
      else acc.pending += payout;
      acc.total += payout;
      return acc;
    },
    { total: 0, paid: 0, ready: 0, pending: 0 }
  );

  const normalizedOrders = orders.map((order: (typeof orders)[number]) => {
    const gross = order.amount || 0;
    const fee = order.platformFee ?? Number(((gross * feePercent) / 100).toFixed(2));
    const payout = order.providerPayoutAmount ?? Number((gross - fee).toFixed(2));
    const effectiveStatus =
      order.payoutStatus === "PAID"
        ? "PAID"
        : order.status === "COMPLETED"
        ? "READY"
        : "UNPAID";
    return {
      ...order,
      platformFee: fee,
      providerPayoutAmount: payout,
      payoutStatus: effectiveStatus,
    };
  });

  return NextResponse.json({ summary, orders: normalizedOrders });
}
