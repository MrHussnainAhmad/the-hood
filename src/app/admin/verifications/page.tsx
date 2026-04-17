"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { BadgeCheck, FileText } from "lucide-react";

interface VerificationItem {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  companyName: string | null;
  companyRegistrationNumber: string | null;
  companyTaxId: string | null;
  companyAddress: string | null;
  companyContactName: string | null;
  companyContactPhone: string | null;
  companyVerificationFiles: string[];
  companyVerificationStatus: string;
  createdAt: string;
}

export default function AdminVerificationsPage() {
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectReasonByUser, setRejectReasonByUser] = useState<Record<string, string>>({});

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/admin/verifications");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch verifications");
      setItems(data);
      window.dispatchEvent(
        new CustomEvent("admin:verifications-seen", {
          detail: { count: Array.isArray(data) ? data.length : 0 },
        })
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch verifications";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const updateVerification = async (item: VerificationItem, status: "VERIFIED" | "REJECTED") => {
    const reason = (rejectReasonByUser[item.id] || "").trim();
    if (status === "REJECTED" && !reason) {
      toast.error("Rejection reason is required");
      return;
    }

    const response = await fetch(`/api/admin/users/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyVerificationStatus: status,
        companyVerificationReviewNote: status === "REJECTED" ? reason : "Verified by admin",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Failed to update verification");
      return;
    }
    toast.success(status === "VERIFIED" ? "Verification approved" : "Verification rejected");
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== item.id);
      window.dispatchEvent(
        new CustomEvent("admin:verifications-seen", {
          detail: { count: next.length },
        })
      );
      return next;
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">Admin Verifications</p>
        <h1 className="mt-3 text-[clamp(1.6rem,3vw,2.5rem)] text-ink">Company Verification Queue</h1>
        <p className="mt-2 text-sm text-neutral-600">Review company provider submissions and approve or reject with notes.</p>
      </header>

      {isLoading ? (
        <div className="grid min-h-[220px] place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center text-neutral-600">No pending verification alerts.</div>
      ) : (
        <section className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="card">
              <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                <div className="space-y-1 text-sm">
                  <p className="text-xl text-ink">{item.name || "Unnamed"}</p>
                  <p className="text-neutral-600">{item.email}</p>
                  {item.companyName && <p><span className="font-semibold">Company:</span> {item.companyName}</p>}
                  {item.companyRegistrationNumber && <p><span className="font-semibold">Registration:</span> {item.companyRegistrationNumber}</p>}
                  {item.companyTaxId && <p><span className="font-semibold">Tax ID:</span> {item.companyTaxId}</p>}
                  {item.companyAddress && <p><span className="font-semibold">Address:</span> {item.companyAddress}</p>}
                  {item.companyContactName && <p><span className="font-semibold">Contact:</span> {item.companyContactName}</p>}
                  {item.companyContactPhone && <p><span className="font-semibold">Phone:</span> {item.companyContactPhone}</p>}
                  <div className="pt-2 flex flex-wrap gap-2">
                    {item.companyVerificationFiles?.map((file, idx) => (
                      <a
                        key={idx}
                        href={file}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-white"
                      >
                        <FileText className="h-3.5 w-3.5" /> File {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 lg:max-w-[360px]">
                  <Button size="sm" onClick={() => updateVerification(item, "VERIFIED")}>
                    <BadgeCheck className="h-4 w-4" />
                    Verify
                  </Button>
                  <Input
                    placeholder="Reason for rejection"
                    value={rejectReasonByUser[item.id] || ""}
                    onChange={(e) =>
                      setRejectReasonByUser((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-rose-200 text-rose-700"
                    onClick={() => updateVerification(item, "REJECTED")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

