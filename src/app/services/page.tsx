import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import {
  Sparkles,
  Paintbrush,
  Wrench,
  Droplets,
  Bug,
  House,
  ArrowUpRight,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getServices() {
  return prisma.service.findMany({
    where: { active: true },
    include: {
      _count: { select: { orders: true } },
      orders: {
        select: {
          review: { select: { rating: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

const iconMap: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  palette: Paintbrush,
  wrench: Wrench,
  droplet: Droplets,
  bug: Bug,
  home: House,
  electrician: Wrench,
  "ac-service": Wrench,
  carpenter: Wrench,
  "tile-marble": House,
  "deep-cleaning": Sparkles,
  "sofa-cleaning": Sparkles,
  "water-tank-cleaning": Droplets,
  "generator-repair": Wrench,
  "inverter-installation": Wrench,
  "cctv-installation": House,
  "ro-water-filter": Droplets,
  handyman: Wrench,
  "bike-service": Wrench,
  "car-detailing": Sparkles,
  "movers-packers": House,
};

const serviceTypeLabel: Record<string, string> = {
  sparkles: "Cleaning",
  palette: "Paint",
  wrench: "Repair",
  droplet: "Plumbing",
  bug: "Pest Control",
  home: "Home",
  electrician: "Electrician",
  "ac-service": "AC Service",
  carpenter: "Carpenter",
  "tile-marble": "Tile & Marble",
  "deep-cleaning": "Deep Cleaning",
  "sofa-cleaning": "Sofa Cleaning",
  "water-tank-cleaning": "Water Tank Cleaning",
  "generator-repair": "Generator Repair",
  "inverter-installation": "Inverter Installation",
  "cctv-installation": "CCTV Installation",
  "ro-water-filter": "RO Water Filter",
  handyman: "Handyman",
  "bike-service": "Bike Service",
  "car-detailing": "Car Detailing",
  "movers-packers": "Movers & Packers",
};

function truncateDescription(text: string, maxChars = 50) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}...`;
}

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const { type, page } = await searchParams;
  const services = await getServices();
  const selectedType = typeof type === "string" ? type : "";
  const currentPage = Math.max(1, Number(page || "1") || 1);
  const pageSize = 12;
  const serviceTypes = Array.from(
    new Set(services.map((service: (typeof services)[number]) => service.icon || "home"))
  );
  const filteredServicesByType = selectedType
    ? services.filter((service: (typeof services)[number]) => (service.icon || "home") === selectedType)
    : services;

  const buildRankedServices = (items: (typeof services)) => {
    const withScore = items.map((service: (typeof services)[number]) => {
      const ratings = service.orders
        .map((order) => order.review?.rating)
        .filter((rating): rating is number => typeof rating === "number");
      const reviewCount = ratings.length;
      const averageRating = reviewCount > 0 ? ratings.reduce((acc, r) => acc + r, 0) / reviewCount : 0;
      const orderCount = service._count.orders;
      // Combined score: rating quality, rating quantity, and order volume.
      const score = averageRating * 100 + reviewCount * 10 + orderCount;
      return { service, score, reviewCount, averageRating, orderCount };
    });

    const topRated = [...withScore]
      .sort((a, b) => b.score - a.score || b.reviewCount - a.reviewCount || b.orderCount - a.orderCount)
      .map((item) => item.service);

    const topRatedIds = new Set(topRated.slice(0, 3).map((service) => service.id));
    const topRatedSection = topRated.slice(0, 3);
    const topRatedBadgeById = new Map(
      withScore
        .filter((item) => topRatedIds.has(item.service.id))
        .map((item) => [item.service.id, item.averageRating.toFixed(1)])
    );

    const newestPool = items.filter((service: (typeof services)[number]) => !topRatedIds.has(service.id));
    const newestSection = [...newestPool]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);

    const usedIds = new Set([...topRatedSection, ...newestSection].map((service) => service.id));
    const randomPool = items.filter((service: (typeof services)[number]) => !usedIds.has(service.id));
    const randomSection = [...randomPool]
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    const primaryIds = new Set(
      [...topRatedSection, ...newestSection, ...randomSection].map((service) => service.id)
    );
    const remainder = items.filter((service: (typeof services)[number]) => !primaryIds.has(service.id));

    return {
      ordered: [...topRatedSection, ...newestSection, ...randomSection, ...remainder],
      topRatedBadgeById,
      newestIds: new Set(newestSection.map((service) => service.id)),
    };
  };

  const rankedData = selectedType ? buildRankedServices(filteredServicesByType) : null;
  const orderedServices = rankedData ? rankedData.ordered : filteredServicesByType;

  const totalServices = orderedServices.length;
  const totalPages = Math.max(1, Math.ceil(totalServices / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageServices = orderedServices.slice(pageStart, pageStart + pageSize);

  const makePageHref = (nextPage: number) => {
    const query = new URLSearchParams();
    if (selectedType) query.set("type", selectedType);
    if (nextPage > 1) query.set("page", String(nextPage));
    const qs = query.toString();
    return qs ? `/services?${qs}` : "/services";
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="section-space pb-12">
        <div className="page-shell">
          <header className="mb-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">Service Catalog</p>
              <h1 className="mt-3 text-[clamp(2rem,5vw,4.2rem)] text-balance text-ink">
                Explore active services published by providers.
              </h1>
            </div>
            <div className="flex flex-col gap-4 lg:pt-10">
              <p className="text-base text-neutral-700">
                Every listing has a clear flow: submit request, pay provider price, and track service status end-to-end.
              </p>
              <form
                method="get"
                className="inline-flex flex-wrap items-center gap-2 self-start rounded-full border border-line/80 bg-white/80 px-2 py-2 shadow-[0_6px_16px_rgba(15,23,42,0.04)] backdrop-blur"
              >
                <label
                  htmlFor="type"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full bg-paper px-3 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-600"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Show Only
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue={selectedType}
                  className="min-h-10 min-w-40 rounded-full border border-line bg-white px-4 text-sm text-ink focus:outline-none"
                >
                  <option value="">All Services</option>
                  {serviceTypes.map((serviceType) => (
                    <option key={serviceType} value={serviceType}>
                      {serviceTypeLabel[serviceType] || serviceType}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="min-h-10 rounded-full bg-primary-700 px-4 text-sm font-semibold text-white"
                >
                  Apply
                </button>
                {selectedType && (
                  <Link
                    href="/services"
                    className="inline-flex min-h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-semibold text-neutral-700"
                  >
                    Reset
                  </Link>
                )}
              </form>
            </div>
          </header>

          {services.length === 0 ? (
            <section className="card py-14 text-center">
              <h2 className="text-3xl text-ink">No active services available</h2>
              <p className="mx-auto mt-3 max-w-xl text-neutral-600">
                Providers are updating listings. Please check again shortly.
              </p>
            </section>
          ) : filteredServicesByType.length === 0 ? (
            <section className="card py-14 text-center">
              <h2 className="text-3xl text-ink">No services found for this type</h2>
              <p className="mx-auto mt-3 max-w-xl text-neutral-600">
                Try another filter or clear to view all available services.
              </p>
            </section>
          ) : (
            <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pageServices.map((service: (typeof services)[number]) => {
                const Icon = iconMap[service.icon || "home"] || House;
                return (
                  <Link key={service.id} href={`/services/${service.id}/book`} className="group block">
                    <article className="card-hover relative h-full">
                      {rankedData?.topRatedBadgeById.has(service.id) && (
                        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 shadow-sm">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          {rankedData.topRatedBadgeById.get(service.id)}
                        </span>
                      )}
                      {!rankedData?.topRatedBadgeById.has(service.id) &&
                        rankedData?.newestIds.has(service.id) && (
                          <span className="absolute right-3 top-3 z-10 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold tracking-[0.04em] text-emerald-800 shadow-sm">
                            NEW
                          </span>
                        )}
                      <div className="inline-flex rounded-lg border border-line bg-paper p-2">
                        <Icon className="h-5 w-5 text-primary-700" />
                      </div>
                      <h2 className="mt-5 text-2xl text-ink">{service.name}</h2>
                      <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                        {truncateDescription(service.description, 50)}
                      </p>
                      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line/80 pt-4">
                        {service.price ? (
                          <p className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                            {service.price}
                          </p>
                        ) : (
                          <p className="text-xs font-semibold text-neutral-500">Quoted by provider</p>
                        )}
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-700">
                          Book
                          <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </section>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {safePage > 1 ? (
                  <Link
                    href={makePageHref(safePage - 1)}
                    className="inline-flex min-h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-semibold text-neutral-700"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex min-h-10 items-center rounded-full border border-line bg-neutral-100 px-4 text-sm font-semibold text-neutral-400">
                    Previous
                  </span>
                )}
                <span className="inline-flex min-h-10 items-center rounded-full bg-paper px-4 text-sm font-semibold text-neutral-700">
                  Page {safePage} of {totalPages}
                </span>
                {safePage < totalPages ? (
                  <Link
                    href={makePageHref(safePage + 1)}
                    className="inline-flex min-h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-semibold text-neutral-700"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="inline-flex min-h-10 items-center rounded-full border border-line bg-neutral-100 px-4 text-sm font-semibold text-neutral-400">
                    Next
                  </span>
                )}
              </div>
            )}
            </>
          )}
        </div>
      </main>

    </div>
  );
}
