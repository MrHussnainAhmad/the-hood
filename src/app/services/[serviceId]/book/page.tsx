"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import PaymentWrapper from "@/components/payment/PaymentWrapper";
import {
  MapPin,
  FileText,
  Upload,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  CircleDollarSign,
  X,
  CalendarDays,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string;
  price: string | null;
}

interface ProviderCoverageLocation {
  id: string;
  city: string;
  area: string | null;
  pincode: string | null;
}

interface PageProps {
  params: Promise<{ serviceId: string }>;
}

export default function BookServicePage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const serviceId = unwrappedParams.serviceId;

  const router = useRouter();
  const { data: session, status } = useSession();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [service, setService] = useState<Service | null>(null);
  const [locationAvailable, setLocationAvailable] = useState<boolean | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [payableAmount, setPayableAmount] = useState(0);
  const [activeOrderId, setActiveOrderId] = useState("");
  const [isFinalizingPayment, setIsFinalizingPayment] = useState(false);
  const [providerCoverage, setProviderCoverage] = useState<ProviderCoverageLocation[]>([]);

  const [formData, setFormData] = useState({
    address: "",
    city: "",
    area: "",
    pincode: "",
    description: "",
    scheduledDate: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const providerAmount = (() => {
    const raw = service?.price ? parseFloat(service.price.replace(/[^0-9.]/g, "")) : NaN;
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  })();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user.role === "PROVIDER") {
      toast.error("Providers cannot book services as consumers.");
      router.push("/provider");
    }
  }, [status, session, router]);

  useEffect(() => {
    async function fetchService() {
      try {
        const [serviceResponse, coverageResponse] = await Promise.all([
          fetch(`/api/services/${serviceId}`),
          fetch(`/api/services/${serviceId}/locations`),
        ]);

        if (serviceResponse.ok) {
          const serviceData = await serviceResponse.json();
          setService(serviceData);
        }

        if (coverageResponse.ok) {
          const coverageData = await coverageResponse.json();
          setProviderCoverage(Array.isArray(coverageData) ? coverageData : []);
        }
      } catch {
        toast.error("Failed to load service");
      }
    }
    fetchService();
  }, [serviceId]);

  const checkLocationAvailability = async () => {
    if (!formData.city.trim() || !formData.pincode.trim()) {
      toast.error("Please enter city and pincode/zipcode");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/locations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          city: formData.city,
          area: formData.area,
          pincode: formData.pincode,
        }),
      });

      const data = await response.json();
      setLocationAvailable(data.available);

      if (data.available) {
        toast.success("Great, provider covers your area.");
        setStep(2);
      } else {
        toast.error("Service is currently unavailable for this location.");
      }
    } catch {
      toast.error("Failed to check availability");
    } finally {
      setIsLoading(false);
    }
  };

  const selectProviderCoverage = (location: ProviderCoverageLocation) => {
    setFormData((prev) => ({
      ...prev,
      city: location.city || "",
      area: location.area || "",
      pincode: location.pincode || "",
    }));
    setLocationAvailable(null);
  };

  const uploadOrderImage = async (file: File) => {
    const payload = new FormData();
    payload.append("file", file);
    payload.append("purpose", "order-image");

    const response = await fetch("/api/uploads", {
      method: "POST",
      body: payload,
    });

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error || "Failed to upload image");
    }

    return String(json.url);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const selectedFiles = Array.from(files);

    if (images.length + selectedFiles.length > 5) {
      toast.error("Maximum 5 images allowed");
      e.target.value = "";
      return;
    }

    for (const file of selectedFiles) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 5MB per image.`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file.`);
        return;
      }
    }

    setIsUploadingImages(true);
    try {
      const uploadedUrls = await Promise.all(
        selectedFiles.map((file) => uploadOrderImage(file))
      );
      setImages((prev) => [...prev, ...uploadedUrls].slice(0, 5));
      toast.success("Images uploaded");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to upload image(s)";
      toast.error(message);
    } finally {
      setIsUploadingImages(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateOrder = async () => {
    if (!formData.description) {
      toast.error("Please provide service description");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          address: formData.address,
          city: formData.city,
          area: formData.area,
          pincode: formData.pincode,
          description: formData.description,
          scheduledDate: formData.scheduledDate || null,
          images,
        }),
      });

      if (!response.ok) throw new Error("Failed to create order");

      const order = await response.json();
      setActiveOrderId(order.id);
      const finalAmount =
        typeof order?.amount === "number" && order.amount > 0 ? order.amount : providerAmount;
      setPayableAmount(finalAmount);

      const paymentResponse = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) throw new Error(paymentData.error || "Failed to create payment");

      setClientSecret(paymentData.clientSecret);
      setShowPayment(true);
      toast.success("Order created. Complete payment to confirm.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create order";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!activeOrderId) {
      toast.error("Order reference missing. Please refresh and try again.");
      return;
    }

    setIsFinalizingPayment(true);
    try {
      const response = await fetch(`/api/orders/${activeOrderId}/payment-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to finalize payment");

      toast.success("Payment confirmed. Provider has been notified.");
      setTimeout(() => {
        setShowPayment(false);
        router.push("/dashboard");
      }, 1000);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Payment completed but confirmation failed.";
      toast.error(message);
    } finally {
      setIsFinalizingPayment(false);
    }
  };

  const handlePaymentCancel = () => {
    if (isFinalizingPayment) return;
    setShowPayment(false);
    toast.info("Payment paused. You can complete it later from dashboard.");
    router.push("/dashboard");
  };

  if (status === "loading" || !service) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="section-space pb-12">
        <div className="page-shell max-w-4xl">
          <header className="mb-8 rounded-xl border border-line bg-white/72 p-5 sm:p-6">
            <button
              onClick={() => router.back()}
              className="focus-ring mb-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-paper px-3 text-sm font-semibold text-neutral-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-600">Service Booking</p>
            <h1 className="mt-2 text-[clamp(1.7rem,4vw,2.6rem)] text-ink">Book {service.name}</h1>
            <p className="mt-2 text-sm text-neutral-700">{service.description}</p>
            <p className="mt-3 inline-flex rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">
              Provider price: ${providerAmount.toFixed(2)}
            </p>
          </header>

          <div className="mb-8 grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { num: 1, label: "Location" },
              { num: 2, label: "Details" },
              { num: 3, label: "Review" },
            ].map((s) => (
              <div
                key={s.num}
                className={`rounded-xl border px-3 py-2 text-center text-xs font-semibold uppercase tracking-[0.12em] sm:text-sm ${
                  step >= s.num ? "border-primary-300 bg-primary-50 text-primary-700" : "border-line bg-white/60 text-neutral-500"
                }`}
              >
                {s.label}
              </div>
            ))}
          </div>

          {step === 1 && (
            <section className="card">
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-paper">
                  <MapPin className="h-5 w-5 text-accent-700" />
                </div>
                <div>
                  <h2 className="text-2xl text-ink">Check Service Location</h2>
                  <p className="text-sm text-neutral-600">We match city, area and pincode/zipcode coverage.</p>
                </div>
              </div>

                <div className="space-y-4">
                {providerCoverage.length > 0 && (
                  <div className="rounded-xl border border-line bg-paper/65 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">
                      Provider Covered Areas
                    </p>
                    <p className="mb-3 text-xs text-neutral-600">
                      Select one, or enter your own city/pincode manually.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {providerCoverage.map((location) => {
                        const label = `${location.city}${location.area ? `, ${location.area}` : ""} - ${location.pincode || "No pincode"}`;
                        const isSelected =
                          formData.city.toLowerCase() === location.city.toLowerCase() &&
                          formData.pincode === (location.pincode || "") &&
                          formData.area.toLowerCase() === (location.area || "").toLowerCase();
                        return (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => selectProviderCoverage(location)}
                            className={`focus-ring min-h-11 rounded-lg border px-3 py-2 text-left text-sm transition ${
                              isSelected
                                ? "border-primary-400 bg-primary-50 text-primary-800"
                                : "border-line bg-white text-neutral-700 hover:bg-paper"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Full Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field focus-ring"
                    placeholder="Street, block, unit"
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="input-field focus-ring"
                      placeholder="City"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Area</label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="input-field focus-ring"
                      placeholder="Area or district"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Pincode / ZIP</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="input-field focus-ring"
                    placeholder="Code"
                  />
                </div>

                {locationAvailable === false && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                    This provider has not added this location yet.
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={checkLocationAvailability}
                  isLoading={isLoading}
                  disabled={!formData.city.trim() || !formData.pincode.trim() || !formData.address.trim()}
                >
                  Check Availability
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="card">
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-paper">
                  <FileText className="h-5 w-5 text-accent-700" />
                </div>
                <div>
                  <h2 className="text-2xl text-ink">Service Details</h2>
                  <p className="text-sm text-neutral-600">Share your request clearly for faster provider response.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field focus-ring min-h-[140px]"
                    placeholder="Describe the issue, size, urgency and any constraints"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Preferred Date and Time</label>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="datetime-local"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      className="input-field focus-ring pl-10"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-paper/65 p-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Reference Images (Max 5)</label>
                  <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-4 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={images.length >= 5 || isUploadingImages}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="mx-auto h-6 w-6 text-neutral-500" />
                      <p className="mt-2 text-sm font-semibold text-neutral-700">
                        {isUploadingImages ? "Uploading..." : "Upload project images"}
                      </p>
                      <p className="text-xs text-neutral-500">{images.length}/5 selected</p>
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {images.map((img, idx) => (
                        <div key={idx} className="group relative overflow-hidden rounded-lg border border-line bg-white">
                          <img src={img} alt={`Evidence ${idx + 1}`} className="h-20 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-between gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={!formData.description || providerAmount <= 0}>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="card">
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-paper">
                  <CheckCircle className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <h2 className="text-2xl text-ink">Confirm and Pay</h2>
                  <p className="text-sm text-neutral-600">Review order summary before payment.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-line bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Service</p>
                  <p className="mt-1 text-lg text-ink">{service.name}</p>
                </div>
                <div className="rounded-xl border border-line bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Location</p>
                  <p className="mt-1 text-sm text-neutral-800">{formData.address}</p>
                  <p className="text-sm text-neutral-600">
                    {formData.city}
                    {formData.area ? `, ${formData.area}` : ""}
                    {formData.pincode ? ` - ${formData.pincode}` : ""}
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Description</p>
                  <p className="mt-1 text-sm text-neutral-700">{formData.description}</p>
                </div>
                {images.length > 0 && (
                  <div className="rounded-xl border border-line bg-white p-4">
                    <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      <ImageIcon className="h-3.5 w-3.5" />
                      Attachments ({images.length})
                    </p>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {images.map((img, idx) => (
                        <img key={idx} src={img} alt={`Attachment ${idx + 1}`} className="h-16 w-full rounded-lg object-cover" />
                      ))}
                    </div>
                  </div>
                )}
                <div className="rounded-xl border border-primary-300 bg-primary-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-700">Payable Amount</p>
                  <p className="mt-1 text-3xl font-bold text-primary-700">${providerAmount.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-primary-700/80">Consumer pays provider-set service amount.</p>
                </div>
              </div>

              <div className="mt-6 flex justify-between gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleCreateOrder} isLoading={isLoading}>
                  Proceed to Payment
                </Button>
              </div>
            </section>
          )}
        </div>
      </main>

      {showPayment && clientSecret && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]">
          <div className="flex h-full items-end justify-center p-0 sm:items-center sm:p-4">
            <div className="flex h-[92dvh] w-full flex-col rounded-t-2xl border border-line bg-white sm:h-auto sm:max-h-[88dvh] sm:max-w-xl sm:rounded-2xl">
              <div className="flex items-start justify-between border-b border-line px-4 py-4 sm:px-6">
                <div>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-paper">
                    <CircleDollarSign className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl text-ink">Complete Payment</h2>
                  <p className="text-sm text-neutral-600">Secure checkout powered by Stripe.</p>
                </div>
                <button
                  type="button"
                  aria-label="Close payment"
                  className="focus-ring grid h-11 w-11 place-items-center rounded-lg border border-line"
                  onClick={handlePaymentCancel}
                  disabled={isFinalizingPayment}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                {isFinalizingPayment && (
                  <div className="mb-4 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800">
                    Finalizing payment and notifying provider...
                  </div>
                )}
                <PaymentWrapper
                  amount={payableAmount || providerAmount}
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

