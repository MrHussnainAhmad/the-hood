import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Sparkles, Paintbrush, Wrench, Droplets, Bug, House, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getServices() {
  return prisma.service.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } });
}

const iconMap: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  palette: Paintbrush,
  wrench: Wrench,
  droplet: Droplets,
  bug: Bug,
  home: House,
};

export default async function ServicesPage() {
  const services = await getServices();

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
            <p className="self-end text-base text-neutral-700">
              Every listing has a clear flow: submit request, pay provider price, and track service status end-to-end.
            </p>
          </header>

          {services.length === 0 ? (
            <section className="card py-14 text-center">
              <h2 className="text-3xl text-ink">No active services available</h2>
              <p className="mx-auto mt-3 max-w-xl text-neutral-600">
                Providers are updating listings. Please check again shortly.
              </p>
            </section>
          ) : (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => {
                const Icon = iconMap[service.icon || "home"] || House;
                return (
                  <Link key={service.id} href={`/services/${service.id}/book`} className="group block">
                    <article className="card-hover h-full">
                      <div className="inline-flex rounded-lg border border-line bg-paper p-2">
                        <Icon className="h-5 w-5 text-primary-700" />
                      </div>
                      <h2 className="mt-5 text-2xl text-ink">{service.name}</h2>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-700">{service.description}</p>
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

