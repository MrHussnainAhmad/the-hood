"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { Search, User, MapPin, ClipboardList } from "lucide-react";

interface Order {
  id: string;
  status: string;
  city: string;
  address: string;
  description: string;
  createdAt: string;
  user: { name: string; email: string; phone: string | null };
  service: { name: string; icon: string | null };
}

const statusPill: Record<string, string> = {
  PROCESSING: "border-amber-200 bg-amber-50 text-amber-800",
  ON_WAY: "border-sky-200 bg-sky-50 text-sky-800",
  WORKING: "border-violet-200 bg-violet-50 text-violet-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
};

export default function ProviderOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedOnceRef = useRef(false);

  const fetchOrders = async (silent = false) => {
    try {
      const response = await fetch("/api/provider/orders");
      const data: Order[] = await response.json();

      const incomingIds = new Set<string>(data.map((order) => order.id));
      if (silent && hasLoadedOnceRef.current) {
        let newCount = 0;
        for (const id of incomingIds) {
          if (!knownOrderIdsRef.current.has(id)) newCount++;
        }
        if (newCount > 0) {
          toast.success(`${newCount} new order${newCount > 1 ? "s" : ""} received`);
        }
      }

      knownOrderIdsRef.current = incomingIds;
      hasLoadedOnceRef.current = true;
      setOrders(data);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(() => {
      fetchOrders(true);
    }, 12000);

    return () => clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return orders;
    const q = query.toLowerCase();
    return orders.filter(
      (o) =>
        o.user.name.toLowerCase().includes(q) ||
        o.service.name.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q)
    );
  }, [orders, query]);

  const updateOrderStatus = async (id: string, status: string) => {
    const response = await fetch(`/api/provider/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      toast.error("Failed to update order");
      return;
    }

    toast.success("Order updated");
    fetchOrders(true);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="section-space pb-12">
        <div className="page-shell">
          <header className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">Provider Orders</p>
            <h1 className="mt-3 text-[clamp(1.8rem,4vw,3rem)] text-ink">Assigned Jobs</h1>
            <p className="mt-2 text-sm text-neutral-600">Monitor incoming requests and move them through status pipeline.</p>
          </header>

          <section className="card mb-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by customer, city, or service"
                className="pl-10"
              />
            </div>
          </section>

          {isLoading ? (
            <div className="grid min-h-[220px] place-items-center">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
            </div>
          ) : (
            <section className="space-y-4">
              {filtered.map((order) => (
                <article key={order.id} className="card">
                  <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-2xl text-ink">{order.service.name}</h3>
                      <p className="mt-1 text-sm text-neutral-600">Order #{order.id.slice(-8)}</p>
                    </div>
                    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusPill[order.status] || "border-line bg-paper text-neutral-700"}`}>
                      {order.status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="mb-3 text-sm text-neutral-700">{order.description}</p>

                  <div className="mb-4 flex flex-wrap gap-3 text-xs font-medium text-neutral-600">
                    <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" />{order.user.name}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{order.city}</span>
                    <span className="inline-flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" />{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {order.status === "PROCESSING" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "ON_WAY")}>Mark On Way</Button>
                    )}
                    {order.status === "ON_WAY" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "WORKING")}>Mark Working</Button>
                    )}
                    {order.status === "WORKING" && (
                      <Button size="sm" onClick={() => updateOrderStatus(order.id, "COMPLETED")}>Mark Completed</Button>
                    )}
                    {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-200 text-rose-700"
                        onClick={() => updateOrderStatus(order.id, "CANCELLED")}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </article>
              ))}
              {filtered.length === 0 && <div className="card text-center text-neutral-500">No orders found.</div>}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

