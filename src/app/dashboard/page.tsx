import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import type { ReactNode } from "react";
import {
  Package,
  Clock3,
  CircleCheck,
  CircleX,
  ArrowUpRight,
  MapPin,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      service: true,
      review: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

type Orders = Awaited<ReturnType<typeof getUserOrders>>;
type Order = Orders[number];

const statusMap: Record<
  string,
  {
    label: string;
    classes: string;
    icon: ReactNode;
  }
> = {
  PROCESSING: {
    label: "Processing",
    classes: "border-amber-200 bg-amber-50 text-amber-800",
    icon: <Clock3 className="h-3.5 w-3.5" />,
  },
  ON_WAY: {
    label: "On Way",
    classes: "border-sky-200 bg-sky-50 text-sky-800",
    icon: <Package className="h-3.5 w-3.5" />,
  },
  WORKING: {
    label: "Working",
    classes: "border-violet-200 bg-violet-50 text-violet-800",
    icon: <Clock3 className="h-3.5 w-3.5" />,
  },
  COMPLETED: {
    label: "Completed",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: <CircleCheck className="h-3.5 w-3.5" />,
  },
  CANCELLED: {
    label: "Cancelled",
    classes: "border-rose-200 bg-rose-50 text-rose-800",
    icon: <CircleX className="h-3.5 w-3.5" />,
  },
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role === "PROVIDER") redirect("/provider");
  if (session.user.role === "ADMIN") redirect("/admin");

  const orders = await getUserOrders(session.user.id);

  const stats = {
    total: orders.length,
    processing: orders.filter((o: Order) => o.status === "PROCESSING").length,
    onWay: orders.filter((o: Order) => o.status === "ON_WAY").length,
    completed: orders.filter((o: Order) => o.status === "COMPLETED").length,
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="section-space pb-12">
        <div className="page-shell">
          <header className="mb-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">Consumer Workspace</p>
              <h1 className="mt-3 text-[clamp(1.8rem,4vw,3rem)] text-ink">Welcome back, {session.user.name}</h1>
              <p className="mt-2 text-sm text-neutral-600">Track your active jobs and service history from one place.</p>
            </div>
            <Link href="/services" className="justify-self-start lg:justify-self-end">
              <Button>
                Book New Service
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </header>

          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="card">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Total Orders</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-ink">{stats.total}</p>
            </article>
            <article className="card">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Processing</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-amber-700">{stats.processing}</p>
            </article>
            <article className="card">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">On Way</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-sky-700">{stats.onWay}</p>
            </article>
            <article className="card">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Completed</p>
              <p className="mt-3 text-4xl font-bold tracking-tight text-emerald-700">{stats.completed}</p>
            </article>
          </section>

          <section className="card">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl text-ink">Recent Orders</h2>
            </div>

            {orders.length === 0 ? (
              <div className="grid min-h-[260px] place-items-center rounded-xl border border-dashed border-line bg-paper/65 p-6 text-center">
                <div>
                  <Package className="mx-auto h-10 w-10 text-neutral-400" />
                  <p className="mt-3 text-lg font-semibold text-ink">No orders yet</p>
                  <p className="mt-1 text-sm text-neutral-600">Book your first service to start tracking activity here.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: Order) => {
                  const status = statusMap[order.status] ?? statusMap.PROCESSING;
                  return (
                    <article key={order.id} className="rounded-xl border border-line bg-white/75 p-4 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="text-xl text-ink">{order.service.name}</h3>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.classes}`}>
                              {status.icon}
                              {status.label}
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm text-neutral-700">{order.description}</p>
                          <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-neutral-600">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {order.city}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="outline" size="sm">View Details</Button>
                          </Link>
                          {order.status === "COMPLETED" && !order.review && (
                            <Link href={`/orders/${order.id}/review`}>
                              <Button size="sm" variant="secondary">Leave Review</Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      {order.images.length > 0 && (
                        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                          {order.images.slice(0, 6).map((img: string, idx: number) => (
                            <div key={idx} className="overflow-hidden rounded-lg border border-line bg-paper">
                              <img src={img} alt="Order evidence" className="h-16 w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

