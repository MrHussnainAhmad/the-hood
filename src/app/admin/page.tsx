import { prisma } from "@/lib/prisma";
import { Users, Briefcase, Package, Clock3, CircleDollarSign } from "lucide-react";

async function getStats() {
  const [
    totalUsers,
    bannedUsers,
    totalServices,
    totalOrders,
    processingOrders,
    completedOrders,
    paidSummary,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.service.count({ where: { active: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PROCESSING" } }),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.aggregate({
      _sum: { amount: true, platformFee: true, providerPayoutAmount: true },
      where: { paymentStatus: "PAID" },
    }),
    prisma.order.findMany({
      take: 7,
      include: {
        user: { select: { name: true, email: true } },
        service: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    totalUsers,
    bannedUsers,
    totalServices,
    totalOrders,
    processingOrders,
    completedOrders,
    totalRevenue: paidSummary._sum.providerPayoutAmount ?? 0,
    platformEarnings: paidSummary._sum.platformFee ?? 0,
    recentOrders,
  };
}

type Stats = Awaited<ReturnType<typeof getStats>>;
type Order = Stats["recentOrders"][number];

const statusPill: Record<string, string> = {
  PROCESSING: "border-amber-200 bg-amber-50 text-amber-800",
  ON_WAY: "border-sky-200 bg-sky-50 text-sky-800",
  WORKING: "border-violet-200 bg-violet-50 text-violet-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
};

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">Admin Workspace</p>
        <h1 className="mt-3 text-[clamp(1.7rem,3vw,2.8rem)] text-ink">Operations Dashboard</h1>
        <p className="mt-2 text-sm text-neutral-600">Live platform metrics for users, services, orders, and revenue.</p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="card">
          <div className="mb-2 inline-flex rounded-lg border border-line bg-paper p-2"><Users className="h-4 w-4 text-primary-700" /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Total Users</p>
          <p className="mt-2 text-4xl font-bold text-ink">{stats.totalUsers}</p>
          <p className="mt-1 text-xs text-neutral-600">{stats.bannedUsers} banned</p>
        </article>
        <article className="card">
          <div className="mb-2 inline-flex rounded-lg border border-line bg-paper p-2"><Briefcase className="h-4 w-4 text-primary-700" /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Services</p>
          <p className="mt-2 text-4xl font-bold text-ink">{stats.totalServices}</p>
        </article>
        <article className="card">
          <div className="mb-2 inline-flex rounded-lg border border-line bg-paper p-2"><Package className="h-4 w-4 text-primary-700" /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Orders</p>
          <p className="mt-2 text-4xl font-bold text-ink">{stats.totalOrders}</p>
          <p className="mt-1 text-xs text-neutral-600">{stats.processingOrders} processing</p>
        </article>
        <article className="card">
          <div className="mb-2 inline-flex rounded-lg border border-line bg-paper p-2"><CircleDollarSign className="h-4 w-4 text-primary-700" /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Revenue (Total)</p>
          <p className="mt-2 text-4xl font-bold text-ink">${stats.totalRevenue.toFixed(2)}</p>
          <p className="mt-1 text-xs text-neutral-600">Provider earnings</p>
        </article>
        <article className="card">
          <div className="mb-2 inline-flex rounded-lg border border-line bg-paper p-2"><CircleDollarSign className="h-4 w-4 text-primary-700" /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Platform Earnings</p>
          <p className="mt-2 text-4xl font-bold text-ink">${stats.platformEarnings.toFixed(2)}</p>
          <p className="mt-1 text-xs text-neutral-600">Fee collected</p>
        </article>
      </section>

      <section className="card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl text-ink">Recent Orders</h2>
          <span className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-neutral-600">
            <Clock3 className="h-3.5 w-3.5" />
            Live feed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-neutral-600">
                <th className="py-3 px-3 font-semibold">Customer</th>
                <th className="py-3 px-3 font-semibold">Service</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order: Order) => (
                <tr key={order.id} className="border-b border-line/70">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-ink">{order.user.name}</p>
                    <p className="text-xs text-neutral-500">{order.user.email}</p>
                  </td>
                  <td className="px-3 py-3 text-neutral-800">{order.service.name}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPill[order.status] || "border-line bg-paper text-neutral-700"}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-neutral-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
