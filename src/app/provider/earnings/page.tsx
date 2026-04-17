"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CreditCard, Link2 } from "lucide-react";

interface EarningOrder {
  id: string;
  status: string;
  payoutStatus: string;
  payoutReleasedAt: string | null;
  amount: number | null;
  platformFee: number | null;
  providerPayoutAmount: number | null;
  createdAt: string;
  service: { name: string };
  user: { name: string | null; email: string };
}

interface EarningsResponse {
  summary: {
    total: number;
    paid: number;
    ready: number;
    pending: number;
  };
  orders: EarningOrder[];
}

interface ConnectStatus {
  connected: boolean;
  onboarded: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  accountId?: string;
}

export default function ProviderEarningsPage() {
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [connect, setConnect] = useState<ConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);

  useEffect(() => {
    const readJsonSafe = async (response: Response) => {
      const text = await response.text();
      if (!text) return {};
      try {
        return JSON.parse(text) as Record<string, unknown>;
      } catch {
        return {};
      }
    };

    const getErrorMessage = (json: Record<string, unknown>, fallback: string) => {
      return typeof json.error === "string" && json.error.trim() ? json.error : fallback;
    };

    const fetchEarnings = async () => {
      try {
        const response = await fetch("/api/provider/earnings");
        const json = await readJsonSafe(response);
        if (!response.ok) throw new Error(getErrorMessage(json, "Failed to fetch earnings"));
        setData(json as unknown as EarningsResponse);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch earnings";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchConnect = async () => {
      try {
        const response = await fetch("/api/provider/connect/status");
        const json = await readJsonSafe(response);
        if (!response.ok) throw new Error(getErrorMessage(json, "Failed to fetch connect status"));
        setConnect(json as unknown as ConnectStatus);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch connect status";
        toast.error(message);
      }
    };

    fetchEarnings();
    fetchConnect();
  }, []);

  const startOnboarding = async () => {
    setIsOnboarding(true);
    try {
      const response = await fetch("/api/provider/connect/onboard", { method: "POST" });
      const text = await response.text();
      const json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      if (!response.ok) throw new Error(typeof json.error === "string" ? json.error : "Failed to start onboarding");
      if (typeof json.url !== "string" || !json.url) {
        throw new Error("Stripe onboarding URL was not returned");
      }
      window.location.href = json.url;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to start onboarding";
      toast.error(message);
      setIsOnboarding(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="section-space pb-12">
        <div className="page-shell">
          <header className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">Provider Earnings</p>
            <h1 className="mt-3 text-[clamp(1.8rem,4vw,3rem)] text-ink">Payout Workspace</h1>
            <p className="mt-2 text-sm text-neutral-600">Monitor earnings breakdown and payout release status.</p>
          </header>

          <section className="card mb-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Stripe Connect</p>
                <p className="mt-1 font-semibold text-ink">
                  {connect?.onboarded ? "Connected for payouts" : "Complete onboarding to receive payouts"}
                </p>
                {connect?.connected && (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-500">
                    <Link2 className="h-3.5 w-3.5" />
                    Account: {connect.accountId}
                  </p>
                )}
              </div>
              <Button onClick={startOnboarding} isLoading={isOnboarding}>
                <CreditCard className="h-4 w-4" />
                {connect?.onboarded ? "Update Stripe Details" : "Connect Stripe"}
              </Button>
            </div>
          </section>

          {isLoading || !data ? (
            <div className="grid min-h-[220px] place-items-center">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
            </div>
          ) : (
            <>
              <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="card"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Total Earned</p><p className="mt-3 text-4xl font-bold text-ink">${data.summary.total.toFixed(2)}</p></article>
                <article className="card"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Paid Out</p><p className="mt-3 text-4xl font-bold text-emerald-700">${data.summary.paid.toFixed(2)}</p></article>
                <article className="card"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Ready for Payout</p><p className="mt-3 text-4xl font-bold text-sky-700">${data.summary.ready.toFixed(2)}</p></article>
                <article className="card"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Pending Completion</p><p className="mt-3 text-4xl font-bold text-amber-700">${data.summary.pending.toFixed(2)}</p></article>
              </section>

              <section className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-neutral-600">
                      <th className="py-3 pr-3">Order</th>
                      <th className="py-3 pr-3">Service</th>
                      <th className="py-3 pr-3">Customer</th>
                      <th className="py-3 pr-3">Gross</th>
                      <th className="py-3 pr-3">Fee</th>
                      <th className="py-3 pr-3">You Get</th>
                      <th className="py-3 pr-3">Payout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.map((order) => (
                      <tr key={order.id} className="border-b border-line/70">
                        <td className="py-3 pr-3">#{order.id.slice(-8)}</td>
                        <td className="py-3 pr-3">{order.service.name}</td>
                        <td className="py-3 pr-3">{order.user.name || order.user.email}</td>
                        <td className="py-3 pr-3">${(order.amount || 0).toFixed(2)}</td>
                        <td className="py-3 pr-3">${(order.platformFee || 0).toFixed(2)}</td>
                        <td className="py-3 pr-3 font-semibold text-emerald-700">${(order.providerPayoutAmount || 0).toFixed(2)}</td>
                        <td className="py-3 pr-3">
                          <span className="inline-flex rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-semibold text-neutral-700">
                            {order.payoutStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

