"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Eye, Package, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Order {
  id: string;
  status: string;
  address: string;
  city: string;
  description: string;
  images: string[];
  createdAt: string;
  scheduledDate: string | null;
  completedDate: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  service: {
    id: string;
    name: string;
    icon: string | null;
  };
}

const statusPill: Record<string, string> = {
  PROCESSING: "border-amber-200 bg-amber-50 text-amber-800",
  ON_WAY: "border-sky-200 bg-sky-50 text-sky-800",
  WORKING: "border-violet-200 bg-violet-50 text-violet-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
};

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders");
      const data = await response.json();
      setOrders(data);
    } catch {
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Order status updated");
        fetchOrders();
      }
    } catch {
      toast.error("Failed to update order");
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    return filtered;
  }, [orders, searchTerm, statusFilter]);

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "PROCESSING":
        return "ON_WAY";
      case "ON_WAY":
        return "COMPLETED";
      default:
        return null;
    }
  };

  const statusCounts = {
    ALL: orders.length,
    PROCESSING: orders.filter((o) => o.status === "PROCESSING").length,
    ON_WAY: orders.filter((o) => o.status === "ON_WAY").length,
    COMPLETED: orders.filter((o) => o.status === "COMPLETED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">Admin Orders</p>
        <h1 className="mt-3 text-[clamp(1.6rem,3vw,2.5rem)] text-ink">Orders Oversight</h1>
        <p className="mt-2 text-sm text-neutral-600">Review order lifecycle and intervene when needed.</p>
      </header>

      <section className="card mb-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by customer, service, city"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`min-h-11 rounded-lg border px-3 text-xs font-semibold uppercase tracking-[0.08em] transition ${
                  statusFilter === status
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-white text-neutral-700 hover:bg-paper"
                }`}
              >
                {status.replace("_", " ")} ({count})
              </button>
            ))}
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="grid min-h-[220px] place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card text-center text-neutral-500">No orders found.</div>
      ) : (
        <section className="space-y-4">
          {filteredOrders.map((order) => {
            const nextStatus = getNextStatus(order.status);

            return (
              <article key={order.id} className="card">
                <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <h2 className="text-xl text-ink">{order.service.name}</h2>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPill[order.status] || "border-line bg-paper text-neutral-700"}`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="text-sm text-neutral-700">Order #{order.id.slice(-8)}</p>
                    <p className="mt-2 text-sm text-neutral-700">{order.description}</p>

                    <div className="mt-3 grid gap-3 text-xs text-neutral-600 sm:grid-cols-2 lg:grid-cols-3">
                      <p><span className="font-semibold">Customer:</span> {order.user.name}</p>
                      <p><span className="font-semibold">City:</span> {order.city}</p>
                      <p><span className="font-semibold">Created:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:w-[240px] lg:justify-end">
                    <Link href={`/admin/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                        Details
                      </Button>
                    </Link>

                    {nextStatus && (
                      <Button size="sm" variant="secondary" onClick={() => updateOrderStatus(order.id, nextStatus)}>
                        {nextStatus === "ON_WAY" ? <Package className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        Mark {nextStatus.replace("_", " ")}
                      </Button>
                    )}

                    {order.status !== "CANCELLED" && order.status !== "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-200 text-rose-700"
                        onClick={() => updateOrderStatus(order.id, "CANCELLED")}
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

