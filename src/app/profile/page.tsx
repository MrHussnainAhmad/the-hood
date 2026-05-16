"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: session?.user?.name || "",
      email: session?.user?.email || "",
    }));
  }, [session?.user?.name, session?.user?.email]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to update profile");
        return;
      }
      await update();
      toast.success("Profile updated successfully");
      setFormData((prev) => ({
        ...prev,
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const ok = confirm("Delete your account? This action cannot be undone.");
    if (!ok) return;
    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/delete-account", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to delete account");
        return;
      }
      toast.success("Account deleted");
      await signOut({ callbackUrl: "/login" });
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  const sendResetPasswordEmail = async () => {
    if (!formData.email) {
      toast.error("Email not available");
      return;
    }
    setIsSendingReset(true);
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to send reset email");
        return;
      }
      toast.success(data.message || "Reset link sent");
    } catch {
      toast.error("Failed to send reset email");
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="section-space pb-12">
        <div className="page-shell max-w-3xl">
          <section className="card">
            <h1 className="text-2xl text-ink">Profile</h1>
            <form onSubmit={handleUpdate} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Phone Number</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Email</label>
                <input value={formData.email} disabled className="input-field bg-paper" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Old Password</label>
                  <input
                    type="password"
                    value={formData.oldPassword}
                    onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">New Password</label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button type="submit" isLoading={isLoading}>
                  Update
                </Button>
                <Button type="button" variant="outline" onClick={sendResetPasswordEmail} isLoading={isSendingReset}>
                  Send Reset Password Email
                </Button>
                <Button type="button" variant="outline" onClick={handleDeleteAccount} isLoading={isDeleting}>
                  Delete Account
                </Button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
