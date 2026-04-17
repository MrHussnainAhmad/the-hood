"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Edit, Trash2, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  price: string | null;
  active: boolean;
  _count: {
    orders: number;
  };
}

export default function ServicesManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "home",
    price: "",
    active: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/admin/services");
      const data = await response.json();
      setServices(data);
    } catch {
      toast.error("Failed to fetch services");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingService
        ? `/api/admin/services/${editingService.id}`
        : "/api/admin/services";

      const response = await fetch(url, {
        method: editingService ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingService ? "Service updated" : "Service created");
        setShowModal(false);
        setEditingService(null);
        resetForm();
        fetchServices();
      }
    } catch {
      toast.error("Failed to save service");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;

    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        toast.success(data?.message || "Service deleted");
        fetchServices();
      } else {
        toast.error(data?.error || "Failed to delete service");
      }
    } catch {
      toast.error("Failed to delete service");
    }
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      icon: service.icon || "home",
      price: service.price || "",
      active: service.active,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "home",
      price: "",
      active: true,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">Admin Services</p>
          <h1 className="mt-3 text-[clamp(1.6rem,3vw,2.5rem)] text-ink">Service Catalog Control</h1>
          <p className="mt-2 text-sm text-neutral-600">Manage active offerings visible to consumers.</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingService(null);
            setShowModal(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </header>

      {isLoading ? (
        <div className="grid min-h-[220px] place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" />
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <article key={service.id} className="card-hover flex h-full flex-col">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-xl text-ink">{service.name}</h2>
                  <p className="mt-1 text-sm text-primary-700">{service.price || "No price set"}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${service.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-line bg-paper text-neutral-700"}`}>
                  {service.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  {service.active ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="line-clamp-3 flex-1 text-sm text-neutral-700">{service.description}</p>

              <div className="mt-5 flex items-center justify-between border-t border-line/80 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">{service._count.orders} orders</p>
                <div className="flex gap-1">
                  <button onClick={() => openEditModal(service)} className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-line text-primary-700 hover:bg-primary-50">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(service.id)} className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-line bg-white p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl text-ink">{editingService ? "Edit Service" : "Add Service"}</h2>
              <button onClick={() => setShowModal(false)} className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-line">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Service Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field min-h-[100px]"
                  required
                />
              </div>

              <Input
                label="Icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />

              <Input
                label="Price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Starting from $50"
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
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingService ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

