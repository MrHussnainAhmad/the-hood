"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { Search, ShieldBan, UserX } from "lucide-react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  providerEmployeeRange: string | null;
  companyVerificationStatus: string | null;
  isBanned: boolean;
  bannedReason: string | null;
  createdAt: string;
  _count: { orders: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      setUsers(data);
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBan = async (user: UserRow) => {
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isBanned: !user.isBanned,
        bannedReason: !user.isBanned ? "Banned by admin" : null,
      }),
    });

    if (!response.ok) {
      toast.error("Failed to update user");
      return;
    }

    toast.success(user.isBanned ? "User unbanned" : "User banned");
    fetchUsers();
  };

  const kickUser = async (userId: string) => {
    if (!confirm("Kick (delete) this user account?")) return;
    const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Failed to delete user");
      return;
    }
    toast.success("User deleted");
    fetchUsers();
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [query, users]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">Admin Users</p>
        <h1 className="mt-3 text-[clamp(1.6rem,3vw,2.5rem)] text-ink">Users and Moderation</h1>
        <p className="mt-2 text-sm text-neutral-600">Search users, apply bans, or permanently kick accounts.</p>
      </header>

      <section className="card mb-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search by name, email, role"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </section>

      {isLoading ? (
        <div className="grid min-h-[220px] place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center text-neutral-500">No users found.</div>
      ) : (
        <section className="space-y-4">
          {filtered.map((user) => (
            <article key={user.id} className="card flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="truncate text-xl text-ink">{user.name || "Unnamed"}</h2>
                <p className="text-sm text-neutral-600">{user.email}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
                  {user.role} | {user._count.orders} orders
                </p>
                {user.role === "PROVIDER" && user.providerEmployeeRange === "10+" && (
                  <p className="mt-1 text-xs text-neutral-600">
                    Company verification: <span className="font-semibold">{user.companyVerificationStatus || "PENDING_DOCUMENTS"}</span>
                  </p>
                )}
                {user.isBanned && (
                  <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-800">
                    Banned: {user.bannedReason || "No reason"}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button size="sm" variant="outline" onClick={() => toggleBan(user)}>
                  <ShieldBan className="h-4 w-4" />
                  {user.isBanned ? "Unban" : "Ban"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-rose-200 text-rose-700"
                  onClick={() => kickUser(user.id)}
                >
                  <UserX className="h-4 w-4" />
                  Kick
                </Button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

