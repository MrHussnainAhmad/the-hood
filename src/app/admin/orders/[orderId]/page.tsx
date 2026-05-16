import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Package, Star } from "lucide-react";
import { censorAbusiveLanguage } from "@/lib/moderation";

const statusPill: Record<string, string> = {
  PROCESSING: "border-amber-200 bg-amber-50 text-amber-800",
  ON_WAY: "border-sky-200 bg-sky-50 text-sky-800",
  WORKING: "border-violet-200 bg-violet-50 text-violet-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
};

async function getOrder(orderId: string) {
  return prisma.order.findUnique({
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
      review: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const order = await getOrder(orderId);
  if (!order) redirect("/admin/orders");

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link
        href="/admin/orders"
        className="focus-ring mb-6 inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-paper px-3 text-sm font-semibold text-neutral-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
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

          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
              statusPill[order.status] || "border-line bg-paper text-neutral-700"
            }`}
          >
            {order.status.replace("_", " ")}
          </span>
        </div>

        <div className="mb-6 grid gap-3 text-sm text-neutral-700 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Customer</p>
            <p>{order.user.name}</p>
            <p>{order.user.email}</p>
            {order.user.phone && <p>{order.user.phone}</p>}
          </div>
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Payment</p>
            <p>Status: {order.paymentStatus}</p>
            <p>Amount: {order.amount ? `${order.currency.toUpperCase()} ${order.amount}` : "N/A"}</p>
            {order.paymentIntentId && <p>Intent: {order.paymentIntentId}</p>}
          </div>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Location</p>
            <p className="inline-flex items-center gap-1 text-sm text-neutral-800">
              <MapPin className="h-3.5 w-3.5" />
              {order.address}
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              {order.city}
              {order.area ? `, ${order.area}` : ""}
              {order.pincode ? ` - ${order.pincode}` : ""}
            </p>
          </div>

          <div className="rounded-xl border border-line bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Timeline</p>
            <p className="text-sm text-neutral-700">Created: {new Date(order.createdAt).toLocaleString()}</p>
            {order.scheduledDate && (
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-neutral-700">
                <CalendarDays className="h-3.5 w-3.5" />
                Scheduled: {new Date(order.scheduledDate).toLocaleString()}
              </p>
            )}
            {order.completedDate && (
              <p className="mt-1 text-sm text-neutral-700">
                Completed: {new Date(order.completedDate).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-line bg-white p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Description</p>
          <p className="text-sm text-neutral-700">{order.description}</p>
        </div>

        {order.images.length > 0 && (
          <div className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Uploaded Images</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {order.images.map((img: string, idx: number) => (
                <div key={idx} className="overflow-hidden rounded-lg border border-line bg-paper">
                  <img src={img} alt={`Order image ${idx + 1}`} className="h-24 w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {order.review && (
          <div className="border-t border-line pt-5">
            <h3 className="text-xl text-ink">Review</h3>
            <div className="mt-3 rounded-xl border border-line bg-paper p-4">
              {(() => {
                const review = order.review;
                return (
                  <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                By {review.user.name} ({review.user.email})
              </p>
              <div className="mb-2 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating ? "fill-amber-500 text-amber-500" : "text-neutral-300"
                    }`}
                  />
                ))}
              </div>
              {review.comment && (
                <p className="text-sm text-neutral-700">{censorAbusiveLanguage(review.comment)}</p>
              )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
