"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MapPin, Plus, Edit, Trash2, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";

interface ProviderLocation {
  id: string;
  city: string;
  area: string | null;
  pincode: string | null;
  active: boolean;
  createdAt: string;
}

export default function ProviderLocationsPage() {
  const [locations, setLocations] = useState<ProviderLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProviderLocation | null>(null);
  const [formData, setFormData] = useState({ city: "", area: "", pincode: "", active: true });

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/provider/locations");
      const data = await response.json();
      setLocations(data);
    } catch {
      toast.error("Failed to fetch service areas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const resetForm = () => {
    setFormData({ city: "", area: "", pincode: "", active: true });
    setEditing(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/provider/locations/${editing.id}` : "/api/provider/locations";
    const method = editing ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Failed to save service area");
      return;
    }

    toast.success(editing ? "Area updated" : "Area added");
    setShowModal(false);
    resetForm();
    fetchLocations();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this service area?")) return;
    const response = await fetch(`/api/provider/locations/${id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Failed to delete service area");
      return;
    }
    toast.success("Service area deleted");
    fetchLocations();
  };

  const toggleActive = async (loc: ProviderLocation) => {
    const response = await fetch(`/api/provider/locations/${loc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city: loc.city, area: loc.area, pincode: loc.pincode, active: !loc.active }),
    });

    if (!response.ok) {
      toast.error("Failed to update status");
      return;
    }

    toast.success(!loc.active ? "Area activated" : "Area deactivated");
    fetchLocations();
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="section-space pb-12">
        <div className="page-shell">
          <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">Provider Coverage</p>
              <h1 className="mt-3 text-[clamp(1.8rem,4vw,3rem)] text-ink">Service Areas</h1>
              <p className="mt-2 text-sm text-neutral-600">Configure where customers can book your services.</p>
            </div>
            <Button onClick={() => { resetForm(); setShowModal(true); }}>
              <Plus className="h-4 w-4" /> Add Area
            </Button>
          </header>

          {isLoading ? (
            <div className="grid min-h-[220px] place-items-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
            </div>
          ) : (
            <section className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-neutral-600">
                    <th className="py-3 px-4 font-semibold">City</th>
                    <th className="py-3 px-4 font-semibold">Area</th>
                    <th className="py-3 px-4 font-semibold">Pincode</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc) => (
                    <tr key={loc.id} className="border-b border-line/70">
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary-600" />{loc.city}</div>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">{loc.area || "-"}</td>
                      <td className="px-4 py-4 text-neutral-600">{loc.pincode || "-"}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => toggleActive(loc)}
                          className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${loc.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line bg-paper text-neutral-700"}`}
                        >
                          {loc.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} {loc.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-line text-primary-700 hover:bg-primary-50"
                            onClick={() => {
                              setEditing(loc);
                              setFormData({ city: loc.city, area: loc.area || "", pincode: loc.pincode || "", active: loc.active });
                              setShowModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                            onClick={() => onDelete(loc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {locations.length === 0 && (
                <div className="py-12 text-center text-neutral-500">No service areas set yet.</div>
              )}
            </section>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-line bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl text-ink">{editing ? "Edit Service Area" : "Add Service Area"}</h2>
              <button onClick={() => setShowModal(false)} className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-line">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <Input label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
              <Input label="Area" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} />
              <Input label="Pincode" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} />
              <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-paper px-3 text-sm text-neutral-700">
                <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
                Active
              </label>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1">{editing ? "Update" : "Add"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

