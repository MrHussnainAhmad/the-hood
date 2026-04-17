import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import { ArrowLeft, MapPin, CalendarDays, Package, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { censorAbusiveLanguage } from "@/lib/moderation";

async function getOrder(orderId: string, userId: string, isAdmin: boolean, isProvider: boolean) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      service: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      review: true,
    },
  });

  if (!order) return null;

  if (!isAdmin && !(isProvider && order.providerId === userId) && order.userId !== userId) {
    return null;
  }

  return order;
}

const statusPill: Record<string, string> = {
  PROCESSING: "border-amber-200 bg-amber-50 text-amber-800",
  ON_WAY: "border-sky-200 bg-sky-50 text-sky-800",
  WORKING: "border-violet-200 bg-violet-50 text-violet-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
};

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  const order = await getOrder(
    orderId,
    session.user.id,
    session.user.role === "ADMIN",
    session.user.role === "PROVIDER"
  );

  if (!order) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="section-space pb-12">
        <div className="page-shell max-w-4xl">
          <Link
            href="/dashboard"
            className="focus-ring mb-6 inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-paper px-3 text-sm font-semibold text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <article className="card">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-lg border border-line bg-paper">
                  <Package className="h-6 w-6 text-primary-700" />
                </div>
                <div>
                  <h1 className="text-2xl text-ink">{order.service.name}</h1>
                  <p className="text-sm text-neutral-600">Order #{order.id.slice(-8)}</p>
                </div>
              </div>

              <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusPill[order.status] || "border-line bg-paper text-neutral-700"}`}>
                {order.status.replace("_", " ")}
              </span>
            </div>

            <div className="mb-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-line bg-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Location</p>
                <p className="inline-flex items-center gap-1 text-sm text-neutral-800"><MapPin className="h-3.5 w-3.5" />{order.address}</p>
                <p className="mt-1 text-sm text-neutral-600">
                  {order.city}
                  {order.area ? `, ${order.area}` : ""}
                  {order.pincode ? ` - ${order.pincode}` : ""}
                </p>
              </div>

              {order.scheduledDate && (
                <div className="rounded-xl border border-line bg-white p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Scheduled</p>
                  <p className="inline-flex items-center gap-1 text-sm text-neutral-800">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(order.scheduledDate).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="mb-6 rounded-xl border border-line bg-white p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Description</p>
              <p className="text-sm text-neutral-700">{order.description}</p>
            </div>

            {order.images.length > 0 && (
              <div className="mb-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Uploaded Images</p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {order.images.map((img, idx) => (
                    <div key={idx} className="overflow-hidden rounded-lg border border-line bg-paper">
                      <img src={img} alt={`Order image ${idx + 1}`} className="h-24 w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.status === "COMPLETED" && !order.review && (
              <div className="border-t border-line pt-5">
                <Link href={`/orders/${order.id}/review`}>
                  <Button className="w-full">
                    <Star className="h-4 w-4" />
                    Leave a Review
                  </Button>
                </Link>
              </div>
            )}

            {order.review && (
              <div className="border-t border-line pt-5">
                <h3 className="text-xl text-ink">Your Review</h3>
                <div className="mt-3 rounded-xl border border-line bg-paper p-4">
                  <div className="mb-2 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          order.review && i < order.review.rating
                            ? "fill-amber-500 text-amber-500"
                            : "text-neutral-300"
                        }`}
                      />
                    ))}
                  </div>
                  {order.review.comment && (
                    <p className="text-sm text-neutral-700">{censorAbusiveLanguage(order.review.comment)}</p>
                  )}
                </div>
              </div>
            )}
          </article>
        </div>
      </main>
    </div>
  );
}

