import { prisma } from "@/lib/prisma";
import Navbar from "@/components/layout/Navbar";
import { Sparkles, Paintbrush, Wrench, Droplets, Bug, House, ArrowRight } from "lucide-react";
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

      <main className="mx-auto w-full max-w-[86rem] px-4 pb-16 pt-10 xs:px-6 md:px-10">
        <header className="mb-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-primary-700">Service Catalog</p>
            <h1 className="mt-3 text-[clamp(2rem,6vw,4.8rem)] text-balance text-ink">Choose the craft your home needs today.</h1>
          </div>
          <p className="max-w-md text-base text-neutral-600">Each listing is created and managed by a provider. Pick a service, submit your details, and track progress from your dashboard.</p>
        </header>

        {services.length === 0 ? (
          <section className="card py-16 text-center">
            <h2 className="text-3xl text-ink">No active services right now</h2>
            <p className="mx-auto mt-3 max-w-xl text-neutral-600">Providers are updating their offerings. Please check again shortly.</p>
          </section>
        ) : (
          <section className="space-y-5">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon || "home"] || House;
              const reverse = index % 2 === 1;

              return (
                <Link key={service.id} href={`/services/${service.id}/book`} className="group block">
                  <article className="relative overflow-hidden rounded-[1.75rem] border border-line/80 bg-white/75 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-premium md:p-8">
                    <div className={`grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center ${reverse ? "md:[&>*:nth-child(2)]:order-3 md:[&>*:nth-child(3)]:order-2" : ""}`}>
                      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[linear-gradient(135deg,#c4492d,#2f7a66)] text-paper shadow-soft md:h-20 md:w-20">
                        <Icon className="h-7 w-7 md:h-9 md:w-9" />
                      </div>

                      <div>
                        <h2 className="text-3xl text-ink md:text-4xl">{service.name}</h2>
                        <p className="mt-3 max-w-2xl text-neutral-600">{service.description}</p>
                        {service.price && (
                          <p className="mt-4 inline-flex rounded-full border border-primary-300/55 bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">
                            {service.price}
                          </p>
                        )}
                      </div>

                      <div className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-paper px-4 py-2 text-sm font-semibold text-neutral-700 transition group-hover:border-accent-600 group-hover:text-accent-700 md:self-center">
                        Book now
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
