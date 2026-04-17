"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Edit, Trash2, MapPin, Eye, EyeOff, Search, X } from "lucide-react";
import { toast } from "sonner";

interface Location {
  id: string;
  city: string;
  area: string | null;
  pincode: string | null;
  active: boolean;
  createdAt: string;
}

export default function LocationsManagement() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    city: "",
    area: "",
    pincode: "",
    active: true,
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const filteredLocations = useMemo(() => {
    return locations.filter(
      (loc) =>
        loc.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.pincode?.includes(searchTerm)
    );
  }, [searchTerm, locations]);

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/admin/locations");
      const data = await response.json();
      setLocations(data);
    } catch {
      toast.error("Failed to fetch locations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.city) {
      toast.error("City is required");
      return;
    }

    try {
      const url = editingLocation
        ? `/api/admin/locations/${editingLocation.id}`
        : "/api/admin/locations";

      const response = await fetch(url, {
        method: editingLocation ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to save location");
        return;
      }

      toast.success(editingLocation ? "Location updated" : "Location added");
      setShowModal(false);
      setEditingLocation(null);
      resetForm();
      fetchLocations();
    } catch {
      toast.error("Failed to save location");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this location?")) return;

    try {
      const response = await fetch(`/api/admin/locations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Location deleted");
        fetchLocations();
      }
    } catch {
      toast.error("Failed to delete location");
    }
  };

  const openEditModal = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      city: location.city,
      area: location.area || "",
      pincode: location.pincode || "",
      active: location.active,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      city: "",
      area: "",
      pincode: "",
      active: true,
    });
  };

  const toggleActive = async (location: Location) => {
    try {
      const response = await fetch(`/api/admin/locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...location,
          active: !location.active,
        }),
      });

      if (response.ok) {
        toast.success(`Location ${!location.active ? "activated" : "deactivated"}`);
        fetchLocations();
      }
    } catch {
      toast.error("Failed to update location");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">Admin Locations</p>
          <h1 className="mt-3 text-[clamp(1.6rem,3vw,2.5rem)] text-ink">Coverage Locations</h1>
          <p className="mt-2 text-sm text-neutral-600">Manage cities, areas and pincodes available across platform.</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingLocation(null);
            setShowModal(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      </header>

      <section className="card mb-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search by city, area, pincode"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <article className="card"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Total</p><p className="mt-2 text-4xl font-bold text-ink">{locations.length}</p></article>
        <article className="card"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Active</p><p className="mt-2 text-4xl font-bold text-emerald-700">{locations.filter((l) => l.active).length}</p></article>
        <article className="card"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Inactive</p><p className="mt-2 text-4xl font-bold text-neutral-400">{locations.filter((l) => !l.active).length}</p></article>
      </section>

      {isLoading ? (
        <div className="grid min-h-[220px] place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
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
                <th className="py-3 px-4 font-semibold">Added</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map((location) => (
                <tr key={location.id} className="border-b border-line/70">
                  <td className="py-4 px-4">
                    <div className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary-600" />{location.city}</div>
                  </td>
                  <td className="py-4 px-4 text-neutral-600">{location.area || "-"}</td>
                  <td className="py-4 px-4 text-neutral-600">{location.pincode || "-"}</td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => toggleActive(location)}
                      className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                        location.active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-line bg-paper text-neutral-700"
                      }`}
                    >
                      {location.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {location.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-neutral-600">{new Date(location.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEditModal(location)} className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-line text-primary-700 hover:bg-primary-50">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(location.id)} className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLocations.length === 0 && (
            <div className="py-12 text-center text-neutral-600">No locations found.</div>
          )}
        </section>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-line bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl text-ink">{editingLocation ? "Edit Location" : "Add Location"}</h2>
              <button onClick={() => setShowModal(false)} className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-line">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                required
              />
              <Input
                label="Area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="Area or district"
              />
              <Input
                label="Pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="Code"
              />
              <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-paper px-3 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                Active
              </label>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1">{editingLocation ? "Update" : "Add"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

