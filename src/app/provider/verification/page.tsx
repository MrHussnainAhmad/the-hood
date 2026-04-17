"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { BadgeCheck, FileText, Upload } from "lucide-react";

interface VerificationData {
  providerEmployeeRange: string | null;
  companyVerificationStatus: string;
  companyVerificationReviewNote: string | null;
  companyName: string | null;
  companyRegistrationNumber: string | null;
  companyTaxId: string | null;
  companyAddress: string | null;
  companyContactName: string | null;
  companyContactPhone: string | null;
  companyVerificationFiles: string[];
}

export default function ProviderVerificationPage() {
  const [data, setData] = useState<VerificationData | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    companyRegistrationNumber: "",
    companyTaxId: "",
    companyAddress: "",
    companyContactName: "",
    companyContactPhone: "",
    files: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const fetchData = async () => {
    const response = await fetch("/api/provider/verification");
    const json = await response.json();
    if (!response.ok) {
      toast.error(json.error || "Failed to fetch verification");
      return;
    }
    setData(json);
    setForm({
      companyName: json.companyName || "",
      companyRegistrationNumber: json.companyRegistrationNumber || "",
      companyTaxId: json.companyTaxId || "",
      companyAddress: json.companyAddress || "",
      companyContactName: json.companyContactName || "",
      companyContactPhone: json.companyContactPhone || "",
      files: Array.isArray(json.companyVerificationFiles) ? json.companyVerificationFiles : [],
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const uploadVerificationFile = async (file: File) => {
    const payload = new FormData();
    payload.append("file", file);
    payload.append("purpose", "verification-file");

    const response = await fetch("/api/uploads", {
      method: "POST",
      body: payload,
    });

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error || "Failed to upload file");
    }

    return String(json.url);
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    const selectedFiles = Array.from(selected);
    if (form.files.length + selectedFiles.length > 5) {
      toast.error("Maximum 5 files allowed");
      e.target.value = "";
      return;
    }

    setIsUploadingFiles(true);
    try {
      const uploadedUrls = await Promise.all(
        selectedFiles.map((file) => uploadVerificationFile(file))
      );
      setForm((prev) => ({
        ...prev,
        files: [...prev.files, ...uploadedUrls].slice(0, 5),
      }));
      toast.success("Files uploaded successfully");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to upload one or more files";
      toast.error(message);
    } finally {
      setIsUploadingFiles(false);
      e.target.value = "";
    }
  };

  const submit = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/provider/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to submit document");
      toast.success("Company verification submitted");
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to submit document";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const locked =
    data?.companyVerificationStatus === "SUBMITTED" ||
    data?.companyVerificationStatus === "VERIFIED";
  const showForm =
    data?.companyVerificationStatus === "PENDING_DOCUMENTS" ||
    data?.companyVerificationStatus === "REJECTED";
  const showSubmittedText = data?.companyVerificationStatus === "SUBMITTED";
  const showVerifiedDetails = data?.companyVerificationStatus === "VERIFIED";

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="section-space pb-12">
        <div className="page-shell max-w-3xl">
          <header className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600">Provider Verification</p>
            <h1 className="mt-3 text-[clamp(1.6rem,3vw,2.4rem)] text-ink">Company Verification</h1>
            <p className="mt-2 text-sm text-neutral-600">Required only for providers marked as 10+ employees.</p>
          </header>

          {!data ? (
            <div className="grid min-h-[220px] place-items-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" /></div>
          ) : data.providerEmployeeRange !== "10+" ? (
            <div className="card text-neutral-700">Verification is not required for your provider bracket.</div>
          ) : showForm ? (
            <section className="card space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Current Status</p>
                <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-line bg-paper px-3 py-1 text-sm font-semibold text-neutral-800">
                  <BadgeCheck className="h-4 w-4" />
                  {data.companyVerificationStatus}
                </p>
                {data.companyVerificationStatus === "REJECTED" && data.companyVerificationReviewNote && (
                  <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    Platform note: {data.companyVerificationReviewNote}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Company Name</label>
                <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="input-field" disabled={locked} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input type="text" value={form.companyRegistrationNumber} onChange={(e) => setForm({ ...form, companyRegistrationNumber: e.target.value })} className="input-field" placeholder="Registration Number" disabled={locked} />
                <input type="text" value={form.companyTaxId} onChange={(e) => setForm({ ...form, companyTaxId: e.target.value })} className="input-field" placeholder="Tax ID" disabled={locked} />
              </div>

              <input type="text" value={form.companyAddress} onChange={(e) => setForm({ ...form, companyAddress: e.target.value })} className="input-field" placeholder="Business Address" disabled={locked} />

              <div className="grid gap-3 sm:grid-cols-2">
                <input type="text" value={form.companyContactName} onChange={(e) => setForm({ ...form, companyContactName: e.target.value })} className="input-field" placeholder="Contact Person" disabled={locked} />
                <input type="text" value={form.companyContactPhone} onChange={(e) => setForm({ ...form, companyContactPhone: e.target.value })} className="input-field" placeholder="Contact Phone" disabled={locked} />
              </div>

              <div className="rounded-xl border border-line bg-paper/70 p-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Verification Files (up to 5)</label>
                <label className="focus-ring inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-neutral-700">
                  <Upload className="h-4 w-4" />
                  {isUploadingFiles ? "Uploading..." : "Upload Files"}
                  <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={handleFiles} disabled={locked || isUploadingFiles} className="hidden" />
                </label>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-neutral-600"><FileText className="h-3.5 w-3.5" />{form.files.length} file(s) selected</p>
              </div>

              <Button onClick={submit} isLoading={isSaving} disabled={locked}>
                {data.companyVerificationStatus === "REJECTED" ? "Resubmit Verification" : "Submit Verification"}
              </Button>
            </section>
          ) : showSubmittedText ? (
            <section className="card">
              <p className="text-sm text-sky-900">
                It can take 2-3 business days to get verified. Meanwhile, you can continue creating services.
              </p>
            </section>
          ) : showVerifiedDetails ? (
            <section className="card space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Current Status</p>
                <p className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                  <BadgeCheck className="h-4 w-4" />
                  VERIFIED
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-line bg-paper px-3 py-2 text-sm"><span className="font-semibold">Company:</span> {data.companyName || "-"}</div>
                <div className="rounded-lg border border-line bg-paper px-3 py-2 text-sm"><span className="font-semibold">Registration:</span> {data.companyRegistrationNumber || "-"}</div>
                <div className="rounded-lg border border-line bg-paper px-3 py-2 text-sm"><span className="font-semibold">Tax ID:</span> {data.companyTaxId || "-"}</div>
                <div className="rounded-lg border border-line bg-paper px-3 py-2 text-sm"><span className="font-semibold">Contact:</span> {data.companyContactName || "-"}</div>
              </div>
              <div className="rounded-lg border border-line bg-paper px-3 py-2 text-sm">
                <span className="font-semibold">Address:</span> {data.companyAddress || "-"}
              </div>
              <div className="rounded-lg border border-line bg-paper px-3 py-2 text-sm">
                <span className="font-semibold">Contact Phone:</span> {data.companyContactPhone || "-"}
              </div>
              <div className="flex flex-wrap gap-2">
                {data.companyVerificationFiles?.map((file, idx) => (
                  <a
                    key={idx}
                    href={file}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-white"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    File {idx + 1}
                  </a>
                ))}
              </div>
              <p className="text-xs text-neutral-500">
                Verification details are locked after approval.
              </p>
            </section>
          ) : (
            <section className="card text-sm text-neutral-700">
              Verification state: {data.companyVerificationStatus}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

