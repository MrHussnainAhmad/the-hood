"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Navbar from "@/components/layout/Navbar";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  X,
  PlusCircle,
  Sparkles,
  Paintbrush,
  Wrench,
  Droplets,
  Bug,
  House,
  Search,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  price: string | null;
  active: boolean;
  adminDeletionReason?: string | null;
  adminDeactivatedAt?: string | null;
  providerDeletionNoticeSeenAt?: string | null;
  _count: { orders: number };
}

interface ServiceArea {
  city: string;
  area: string;
  pincode: string;
}

interface ProviderLocation {
  id: string;
  city: string;
  area: string | null;
  pincode: string | null;
  active: boolean;
}

const baseServiceTypeOptions: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "home", label: "Home", Icon: House },
  { value: "sparkles", label: "Cleaning", Icon: Sparkles },
  { value: "palette", label: "Painting", Icon: Paintbrush },
  { value: "wrench", label: "Repairs", Icon: Wrench },
  { value: "droplet", label: "Plumbing", Icon: Droplets },
  { value: "bug", label: "Pest Control", Icon: Bug },
];

const moreServiceTypeOptions: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "electrician", label: "Electrician", Icon: Wrench },
  { value: "ac-service", label: "AC Service", Icon: Wrench },
  { value: "carpenter", label: "Carpenter", Icon: Wrench },
  { value: "tile-marble", label: "Tile & Marble", Icon: House },
  { value: "deep-cleaning", label: "Deep Cleaning", Icon: Sparkles },
  { value: "sofa-cleaning", label: "Sofa Cleaning", Icon: Sparkles },
  { value: "water-tank-cleaning", label: "Water Tank Cleaning", Icon: Droplets },
  { value: "generator-repair", label: "Generator Repair", Icon: Wrench },
  { value: "inverter-installation", label: "Inverter Installation", Icon: Wrench },
  { value: "cctv-installation", label: "CCTV Installation", Icon: House },
  { value: "ro-water-filter", label: "RO Water Filter", Icon: Droplets },
  { value: "handyman", label: "Handyman", Icon: Wrench },
  { value: "bike-service", label: "Bike Service", Icon: Wrench },
  { value: "car-detailing", label: "Car Detailing", Icon: Sparkles },
  { value: "movers-packers", label: "Movers & Packers", Icon: House },
];

const allServiceTypeOptions = [...baseServiceTypeOptions, ...moreServiceTypeOptions];
const moreServiceTypeValues = new Set(moreServiceTypeOptions.map((item) => item.value));

export default function ProviderServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [providerLocations, setProviderLocations] = useState<ProviderLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [iconSearch, setIconSearch] = useState("");
  const [showMoreServiceTypes, setShowMoreServiceTypes] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "home",
    price: "",
    active: true,
    selectedLocationIds: [] as string[],
    serviceAreas: [{ city: "", area: "", pincode: "" }] as ServiceArea[],
  });

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/provider/services");
      const data = await response.json();
      setServices(data);
    } catch {
      toast.error("Failed to fetch services");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProviderLocations = async () => {
    try {
      const response = await fetch("/api/provider/locations");
      if (!response.ok) return;
      const data = await response.json();
      setProviderLocations(Array.isArray(data) ? data : []);
    } catch {
      // Non-blocking for service management flow.
    }
  };

  useEffect(() => {
    Promise.all([fetchServices(), fetchProviderLocations()]);
  }, []);

  useEffect(() => {
    services.forEach((service) => {
      const hasUnreadAdminNotice =
        !service.active &&
        !!service.adminDeactivatedAt &&
        !service.providerDeletionNoticeSeenAt;
      if (!hasUnreadAdminNotice) return;

      const hasReason = Boolean(service.adminDeletionReason && service.adminDeletionReason.trim());
      const heading = hasReason ? "Service Removed by Admins" : "Service Removed Alert.";
      const body = hasReason
        ? `Reason: ${service.adminDeletionReason}`
        : `We are Sorry your ${service.name} has been removed from platform, Please make sure not to provide this type of services else you may get Ban. For Appeal Contact us.`;

      toast.error(`${heading}\n${body}`, {
        id: `service-admin-deactivation-${service.id}`,
        duration: Infinity,
        closeButton: true,
        onDismiss: async () => {
          try {
            await fetch(`/api/provider/services/${service.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ acknowledgeAdminDeletionNotice: true }),
            });
            setServices((prev) =>
              prev.map((item) =>
                item.id === service.id
                  ? { ...item, providerDeletionNoticeSeenAt: new Date().toISOString() }
                  : item
              )
            );
          } catch {
            // best effort only
          }
        },
      });
    });
  }, [services]);

  const resetForm = () =>
    setFormData({
      name: "",
      description: "",
      icon: "home",
      price: "",
      active: true,
      selectedLocationIds: [],
      serviceAreas: [{ city: "", area: "", pincode: "" }],
    });

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
    setIconSearch("");
    setShowMoreServiceTypes(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingService
      ? `/api/provider/services/${editingService.id}`
      : "/api/provider/services";
    const method = editingService ? "PATCH" : "POST";

    const hasAnyLocation =
      formData.selectedLocationIds.length > 0 ||
      formData.serviceAreas.some((a) => a.city.trim());
    if (!editingService && !hasAnyLocation) {
      toast.error("Please select an existing location or add a new one");
      return;
    }

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      toast.error("Failed to save service");
      return;
    }

    toast.success(editingService ? "Service updated" : "Service created");
    closeModal();
    fetchServices();
    fetchProviderLocations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    const response = await fetch(`/api/provider/services/${id}`, {
      method: "DELETE",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(data?.error || "Failed to delete service");
      return;
    }
    toast.success(data?.message || "Service deleted");
    fetchServices();
  };

  const addLocationRow = () => {
    setFormData((prev) => ({
      ...prev,
      serviceAreas: [...prev.serviceAreas, { city: "", area: "", pincode: "" }],
    }));
  };

  const removeLocationRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      serviceAreas:
        prev.serviceAreas.length === 1
          ? prev.serviceAreas
          : prev.serviceAreas.filter((_, i) => i !== index),
    }));
  };

  const updateLocationRow = (index: number, key: keyof ServiceArea, value: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceAreas: prev.serviceAreas.map((row, i) =>
        i === index ? { ...row, [key]: value } : row
      ),
    }));
  };

  const toggleSelectedLocation = (locationId: string) => {
    setFormData((prev) => {
      const exists = prev.selectedLocationIds.includes(locationId);
      return {
        ...prev,
        selectedLocationIds: exists
          ? prev.selectedLocationIds.filter((id) => id !== locationId)
          : [...prev.selectedLocationIds, locationId],
      };
    });
  };

  const formatLocation = (location: ProviderLocation) => {
    return [location.city, location.area, location.pincode].filter(Boolean).join(", ");
  };

  const visibleServiceTypeOptions = showMoreServiceTypes
    ? allServiceTypeOptions
    : baseServiceTypeOptions;

  const filteredServiceTypeOptions = (
    iconSearch.trim().length > 0 ? allServiceTypeOptions : visibleServiceTypeOptions
  ).filter((opt) =>
    `${opt.label} ${opt.value}`.toLowerCase().includes(iconSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="section-space pb-12">
        <div className="page-shell max-w-6xl">
        <section className="mb-6 rounded-xl border border-line bg-white/72 p-4 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-[clamp(1.6rem,4vw,2.3rem)] font-display text-neutral-900">
                My Services
              </h1>
              <p className="mt-2 text-sm text-neutral-600 sm:text-base">
                Create, update, and delete your services. Add a service area directly while creating.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
              <Link href="/provider/locations" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  Manage Service Areas
                </Button>
              </Link>
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  resetForm();
                  setEditingService(null);
                  setShowMoreServiceTypes(false);
                  setShowModal(true);
                }}
              >
                <Plus className="h-5 w-5" /> Add Service
              </Button>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="grid place-items-center py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
          </div>
        ) : services.length === 0 ? (
          <section className="rounded-xl border border-line bg-white/72 p-10 text-center">
            <p className="text-lg font-semibold text-neutral-800">No services yet</p>
            <p className="mt-2 text-sm text-neutral-600">Add your first service to start receiving orders.</p>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((service) => (
              <article key={service.id} className="card-hover flex h-full flex-col">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-neutral-900">{service.name}</h3>
                    <p className="mt-1 text-sm font-medium text-primary-700">{service.price || "No price set"}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
                    {service._count.orders} orders
                  </span>
                </div>

                <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-neutral-600">
                  {service.description}
                </p>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEditingService(service);
                      setFormData({
                        name: service.name,
                        description: service.description,
                        icon: service.icon || "home",
                        price: service.price || "",
                        active: service.active,
                        selectedLocationIds: [],
                        serviceAreas: [{ city: "", area: "", pincode: "" }],
                      });
                      setShowMoreServiceTypes(
                        Boolean(service.icon && moreServiceTypeValues.has(service.icon))
                      );
                      setShowModal(true);
                    }}
                  >
                    <Edit className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-red-200 text-red-600"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </article>
            ))}
          </section>
        )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]">
          <div className="flex h-full items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="flex h-[92dvh] w-full flex-col rounded-t-2xl border border-line bg-white sm:h-auto sm:max-h-[88dvh] sm:max-w-2xl sm:rounded-2xl">
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 sm:px-6">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">
                    {editingService ? "Edit Service" : "Create Service"}
                  </h2>
                  <p className="mt-1 text-xs text-neutral-500">All fields fit on mobile and scroll safely.</p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  className="grid h-11 w-11 place-items-center rounded-full border border-neutral-200"
                  onClick={closeModal}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <div className="space-y-4">
                  <Input
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-700">Description</label>
                    <textarea
                      className="input-field min-h-[110px]"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
                      <p className="mb-3 text-sm font-semibold text-neutral-800">Service Icon</p>
                      <div className="relative mb-3">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="text"
                          value={iconSearch}
                          onChange={(e) => setIconSearch(e.target.value)}
                          placeholder="Search icon by service type..."
                          className="input-field pl-9"
                        />
                      </div>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-xs text-neutral-500">
                          {showMoreServiceTypes
                            ? "Showing all service types"
                            : "Showing common service types"}
                        </p>
                        <button
                          type="button"
                          className="rounded-full border border-primary-200 px-3 py-1 text-xs font-semibold text-primary-700"
                          onClick={() => setShowMoreServiceTypes((prev) => !prev)}
                        >
                          {showMoreServiceTypes ? "Show Less" : "Show More Services"}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {filteredServiceTypeOptions.map((opt) => {
                            const selected = formData.icon === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, icon: opt.value })}
                                className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                                  selected
                                    ? "border-primary-500 bg-primary-50 text-primary-700"
                                    : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-200"
                                }`}
                              >
                                <opt.Icon className="h-4 w-4" />
                                <span className="truncate">{opt.label}</span>
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    <Input
                      label="Price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                        <MapPin className="h-4 w-4 text-primary-700" /> Service Locations
                      </p>
                      <button
                        type="button"
                        onClick={addLocationRow}
                        className="inline-flex min-h-11 items-center gap-1 rounded-full border border-primary-200 px-3 text-xs font-semibold text-primary-700"
                      >
                        <PlusCircle className="h-4 w-4" /> Add Location
                      </button>
                    </div>

                    {providerLocations.length > 0 && (
                      <div className="mb-4 rounded-xl border border-neutral-200 bg-white p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">
                          Select Existing Locations
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {providerLocations.map((location) => {
                            const selected = formData.selectedLocationIds.includes(location.id);
                            return (
                              <button
                                key={location.id}
                                type="button"
                                onClick={() => toggleSelectedLocation(location.id)}
                                className={`flex min-h-11 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                                  selected
                                    ? "border-primary-500 bg-primary-50 text-primary-700"
                                    : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-200"
                                }`}
                              >
                                <span className="truncate">{formatLocation(location)}</span>
                                <span className="ml-2 text-xs font-semibold">
                                  {selected ? "Selected" : "Select"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {formData.serviceAreas.map((row, index) => (
                        <div key={index} className="rounded-xl border border-neutral-200 bg-white p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-medium text-neutral-600">Location {index + 1}</p>
                            {formData.serviceAreas.length > 1 && (
                              <button
                                type="button"
                                className="text-xs font-semibold text-red-600"
                                onClick={() => removeLocationRow(index)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Input
                              label="City"
                              value={row.city}
                              onChange={(e) => updateLocationRow(index, "city", e.target.value)}
                              required={
                                !editingService &&
                                index === 0 &&
                                formData.selectedLocationIds.length === 0
                              }
                            />
                            <Input
                              label="Area"
                              value={row.area}
                              onChange={(e) => updateLocationRow(index, "area", e.target.value)}
                            />
                          </div>
                          <div className="mt-3">
                            <Input
                              label="Pincode"
                              value={row.pincode}
                              onChange={(e) => updateLocationRow(index, "pincode", e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-neutral-500">
                      You can select existing locations and/or add new ones.
                    </p>
                  </div>

                  <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    />
                    Active
                  </label>
                </div>

                <div className="sticky bottom-0 mt-6 border-t border-neutral-200 bg-white/95 pt-4 backdrop-blur">
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={closeModal}>
                      Cancel
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto">
                      {editingService ? "Update Service" : "Create Service"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
