"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { User, Mail, Phone, MapPin, Save } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      await update();
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="section-space pb-12">
        <div className="page-shell max-w-3xl">
          <header className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">Account</p>
            <h1 className="mt-3 text-[clamp(1.6rem,3vw,2.5rem)] text-ink">My Profile</h1>
            <p className="mt-2 text-sm text-neutral-600">Manage personal details used across bookings and services.</p>
          </header>

          <section className="card">
            <div className="mb-6 flex items-center gap-4 border-b border-line pb-6">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-ink text-3xl font-bold text-paper">
                {session?.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="text-2xl text-ink">{session?.user?.name}</h2>
                <p className="text-sm text-neutral-600">{session?.user?.email}</p>
                <span className="mt-2 inline-flex rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700">
                  {session?.user?.role}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Full Name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input type="email" value={formData.email} disabled className="input-field cursor-not-allowed bg-paper pl-10" />
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">Email cannot be changed.</p>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Phone</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field pl-10"
                    placeholder="Phone number"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Address</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field min-h-[100px] pl-10"
                    placeholder="Address"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFormData({
                      name: session?.user?.name || "",
                      email: session?.user?.email || "",
                      phone: "",
                      address: "",
                    })
                  }
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

