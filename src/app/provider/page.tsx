import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowUpRight, BriefcaseBusiness, ListChecks, MapPin, Wallet, BadgeCheck } from "lucide-react";

export const dynamic = "force-dynamic";

async function getProviderStats(providerId: string) {
  const [servicesCount, ordersCount, processingCount, completedCount, locationsCount] = await Promise.all([
    prisma.service.count({ where: { providerId } }),
    prisma.order.count({ where: { providerId } }),
    prisma.order.count({ where: { providerId, status: "PROCESSING" } }),
    prisma.order.count({ where: { providerId, status: "COMPLETED" } }),
    prisma.providerLocation.count({ where: { providerId, active: true } }),
  ]);

  return { servicesCount, ordersCount, processingCount, completedCount, locationsCount };
}

async function getProviderVerification(providerId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: providerId },
      select: {
        providerEmployeeRange: true,
        companyVerificationStatus: true,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Unknown field `providerEmployeeRange`")) {
      return null;
    }
    throw error;
  }
}

export default async function ProviderDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "PROVIDER") redirect("/dashboard");

  const stats = await getProviderStats(session.user.id);
  const verification = await getProviderVerification(session.user.id);
  const isCompany = verification?.providerEmployeeRange === "10+";

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="section-space pb-12">
        <div className="page-shell">
          <header className="mb-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">Provider Workspace</p>
              <h1 className="mt-3 text-[clamp(1.8rem,4vw,3rem)] text-ink">Service Operations Panel</h1>
              <p className="mt-2 text-sm text-neutral-600">Manage listings, orders, payout visibility and service coverage.</p>
            </div>
            <Link href="/provider/services" className="justify-self-start lg:justify-self-end">
              <Button>
                Open Services
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </Link>
          </header>

          {isCompany && verification?.companyVerificationStatus !== "VERIFIED" && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Company verification status: <strong>{verification?.companyVerificationStatus}</strong>. Your submission is reviewed by admin.
            </div>
          )}

          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <article className="card"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Services</p><p className="mt-3 text-4xl font-bold text-ink">{stats.servicesCount}</p></article>
            <article className="card"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Orders</p><p className="mt-3 text-4xl font-bold text-ink">{stats.ordersCount}</p></article>
            <article className="card"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Processing</p><p className="mt-3 text-4xl font-bold text-amber-700">{stats.processingCount}</p></article>
            <article className="card"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Completed</p><p className="mt-3 text-4xl font-bold text-emerald-700">{stats.completedCount}</p></article>
            <article className="card"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Active Areas</p><p className="mt-3 text-4xl font-bold text-accent-700">{stats.locationsCount}</p></article>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Link href="/provider/services" className="card-hover block">
              <BriefcaseBusiness className="h-5 w-5 text-primary-700" />
              <h2 className="mt-4 text-2xl text-ink">Services</h2>
              <p className="mt-2 text-sm text-neutral-600">Create, edit and manage service catalog.</p>
            </Link>
            <Link href="/provider/orders" className="card-hover block">
              <ListChecks className="h-5 w-5 text-primary-700" />
              <h2 className="mt-4 text-2xl text-ink">Orders</h2>
              <p className="mt-2 text-sm text-neutral-600">Update status from processing to completed.</p>
            </Link>
            <Link href="/provider/earnings" className="card-hover block">
              <Wallet className="h-5 w-5 text-primary-700" />
              <h2 className="mt-4 text-2xl text-ink">Earnings</h2>
              <p className="mt-2 text-sm text-neutral-600">Track payout-ready amounts and Stripe status.</p>
            </Link>
            <Link href="/provider/locations" className="card-hover block">
              <MapPin className="h-5 w-5 text-primary-700" />
              <h2 className="mt-4 text-2xl text-ink">Service Areas</h2>
              <p className="mt-2 text-sm text-neutral-600">Define cities, areas and pincodes you cover.</p>
            </Link>
            {isCompany && (
              <Link href="/provider/verification" className="card-hover block">
                <BadgeCheck className="h-5 w-5 text-primary-700" />
                <h2 className="mt-4 text-2xl text-ink">Company Verification</h2>
                <p className="mt-2 text-sm text-neutral-600">Review verification submission and status updates.</p>
              </Link>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

