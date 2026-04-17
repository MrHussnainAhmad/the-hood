import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CircleDollarSign,
  Clock3,
  MapPinned,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ReviewsSection from "@/components/home/ReviewsSection";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    if (session.user.role === "ADMIN") redirect("/admin");
    if (session.user.role === "PROVIDER") redirect("/provider");
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen texture-grain">
      <Navbar />

      <main>
        <section className="section-space">
          <div className="page-shell grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
            <article className="relative overflow-hidden rounded-2xl border border-line/70 bg-white/70 p-6 sm:p-8 lg:p-12">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-paper px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-700">
                Service Outsourcing Platform
              </div>
              <h1 className="fluid-title max-w-4xl text-balance text-ink">
                Service operations for homes, teams, and verified local providers.
              </h1>
              <p className="fluid-subtitle mt-6 max-w-2xl text-neutral-700">
                The Hood is a two-sided marketplace where consumers book local services and providers run structured workflows from listing to completion.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/register" className="btn-primary">
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/services" className="btn-secondary">
                  Browse Services
                </Link>
              </div>
            </article>

            <aside className="grid gap-4">
              <div className="card bg-white">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Consumer Flow</p>
                <p className="mt-3 text-2xl text-ink">Find, book, pay, track, review.</p>
              </div>
              <div className="card bg-white">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Provider Flow</p>
                <p className="mt-3 text-2xl text-ink">Publish services, manage orders, receive payouts.</p>
              </div>
              <div className="card bg-[linear-gradient(155deg,#1f3d35,#2f5d50)] text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">Admin Oversight</p>
                <p className="mt-3 text-2xl leading-tight">Moderation, verification, revenue and payouts.</p>
              </div>
            </aside>
          </div>
        </section>

        <section id="how" className="section-space pt-0">
          <div className="page-shell">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-[clamp(1.9rem,4vw,3.4rem)] text-ink">Built for real service logistics</h2>
              <p className="max-w-md text-sm text-neutral-600">
                Structured enough for operational use, simple enough for first-time users.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-12">
              <article className="card md:col-span-7 lg:col-span-5">
                <BadgeCheck className="h-5 w-5 text-accent-600" />
                <h3 className="mt-4 text-2xl text-ink">Role-based workflows</h3>
                <p className="mt-3 text-neutral-700">
                  Consumer, provider, and admin surfaces are separated to reduce confusion and improve execution speed.
                </p>
              </article>
              <article className="card md:col-span-5 lg:col-span-3">
                <MapPinned className="h-5 w-5 text-primary-600" />
                <h3 className="mt-4 text-xl text-ink">Location matching</h3>
                <p className="mt-3 text-sm text-neutral-700">
                  Orders are validated by city, area, and pincode/zipcode matching logic.
                </p>
              </article>
              <article className="card md:col-span-6 lg:col-span-2">
                <Clock3 className="h-5 w-5 text-accent-700" />
                <h3 className="mt-4 text-xl text-ink">Status transitions</h3>
                <p className="mt-3 text-sm text-neutral-700">Processing, on-way, working, completed.</p>
              </article>
              <article className="card md:col-span-6 lg:col-span-2">
                <CircleDollarSign className="h-5 w-5 text-primary-700" />
                <h3 className="mt-4 text-xl text-ink">Platform fees</h3>
                <p className="mt-3 text-sm text-neutral-700">Tiered by provider team size.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section-space pt-0">
          <div className="page-shell">
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <article className="card bg-[linear-gradient(155deg,#121417,#2f353b)] text-white">
                <BriefcaseBusiness className="h-6 w-6 text-white" />
                <h2 className="mt-5 text-[clamp(1.6rem,3vw,2.4rem)] leading-tight">
                  Outsourcing-ready structure for your FYP demonstration.
                </h2>
                <p className="mt-4 text-sm text-white/80">
                  This architecture supports both local freelancers and company providers with compliance and admin controls.
                </p>
              </article>
              <div id="reviews">
                <ReviewsSection />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

