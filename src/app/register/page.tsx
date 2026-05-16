"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, BriefcaseBusiness, Eye, EyeOff, Home, Lock, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import zxcvbn from "zxcvbn";

const MIN_PASSWORD_LENGTH = 10;
const MIN_PASSWORD_SCORE = 3;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "CONSUMER",
    providerEmployeeRange: "1",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordStrength = zxcvbn(formData.password || "");

  const strengthLabel =
    passwordStrength.score <= 1
      ? "Weak"
      : passwordStrength.score === 2
      ? "Fair"
      : passwordStrength.score === 3
      ? "Strong"
      : "Very Strong";
  const strengthBarWidth = `${((passwordStrength.score + 1) / 5) * 100}%`;
  const strengthBarColor =
    passwordStrength.score <= 1
      ? "bg-rose-500"
      : passwordStrength.score === 2
      ? "bg-amber-500"
      : "bg-emerald-500";

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.phone) {
      newErrors.phone = "Phone is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Phone must be 10 digits";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
      newErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    } else if (passwordStrength.score < MIN_PASSWORD_SCORE) {
      newErrors.password = "Password is too weak. Use a stronger password.";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.role === "PROVIDER" && !formData.providerEmployeeRange) {
      newErrors.providerEmployeeRange = "Please select team size";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          providerEmployeeRange: formData.providerEmployeeRange,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      toast.success(
        "Verification Link has been sent to your mail, Please check your Inbox or Junk/Spam Folder...."
      );
      router.push("/login");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const platformFee =
    formData.providerEmployeeRange === "1"
      ? "7%"
      : formData.providerEmployeeRange === "2-5"
      ? "10%"
      : formData.providerEmployeeRange === "5-10"
      ? "13%"
      : "15%";

  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto grid min-h-screen max-w-[88rem] items-stretch gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-10">
        <section className="relative hidden rounded-2xl border border-line/70 bg-[linear-gradient(165deg,#2f5d50,#1f3d35)] p-10 text-white lg:block">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/15">
              <Home className="h-5 w-5" />
            </span>
            <span className="font-display text-3xl">The Hood</span>
          </Link>

          <div className="mt-14">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Onboarding</p>
            <h1 className="mt-4 max-w-xl text-[clamp(2rem,4vw,3.6rem)] leading-tight">
              Build your account as consumer or provider in one flow.
            </h1>
            <p className="mt-4 max-w-lg text-sm text-white/80">
              Provider tiering, company verification and platform fee structure are built into registration.
            </p>
          </div>

          <div className="mt-12 grid gap-4">
            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <p className="text-sm font-semibold">Provider Team Brackets</p>
              <p className="mt-1 text-sm text-white/75">1, 2-5, 5-10, 10+ (company)</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <p className="text-sm font-semibold">Company Verification Flow</p>
              <p className="mt-1 text-sm text-white/75">10+ providers submit documents post-signup for admin review.</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center rounded-2xl border border-line/70 bg-white/75 p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-xl">
            <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 lg:hidden">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            <div className="mb-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-primary-700">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
                Create Account
              </p>
              <h2 className="mt-4 text-4xl text-ink">Join The Hood</h2>
              <p className="mt-2 text-sm text-neutral-600">Set your profile and role to start booking or offering services.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Full Name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`input-field focus-ring pl-10 ${errors.name ? "border-red-500 bg-red-50/40" : ""}`}
                      placeholder="John Doe"
                    />
                  </div>
                  {errors.name && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Phone Number</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`input-field focus-ring pl-10 ${errors.phone ? "border-red-500 bg-red-50/40" : ""}`}
                      placeholder="03001234567"
                    />
                  </div>
                  {errors.phone && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Email Address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`input-field focus-ring pl-10 ${errors.email ? "border-red-500 bg-red-50/40" : ""}`}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email}</p>}
              </div>

              <div>
                <p className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Are You A</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "CONSUMER" })}
                    className={`focus-ring min-h-11 rounded-lg border px-3 text-sm font-semibold transition ${
                      formData.role === "CONSUMER" ? "border-primary-500 bg-primary-50 text-primary-700" : "border-line bg-white text-neutral-700"
                    }`}
                  >
                    Consumer
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: "PROVIDER" })}
                    className={`focus-ring min-h-11 rounded-lg border px-3 text-sm font-semibold transition ${
                      formData.role === "PROVIDER" ? "border-accent-500 bg-accent-50 text-accent-700" : "border-line bg-white text-neutral-700"
                    }`}
                  >
                    Provider
                  </button>
                </div>
              </div>

              {formData.role === "PROVIDER" && (
                <div className="rounded-xl border border-line bg-neutral-50 p-4">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Number of Employees</label>
                  <select
                    value={formData.providerEmployeeRange}
                    onChange={(e) => setFormData({ ...formData, providerEmployeeRange: e.target.value })}
                    className={`input-field focus-ring ${errors.providerEmployeeRange ? "border-red-500 bg-red-50/40" : ""}`}
                  >
                    <option value="1">1</option>
                    <option value="2-5">2-5</option>
                    <option value="5-10">5-10</option>
                    <option value="10+">10+ (company)</option>
                  </select>
                  {errors.providerEmployeeRange && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{errors.providerEmployeeRange}</p>
                  )}
                  <p className="mt-2 text-xs font-medium text-neutral-700">Platform fee for selected tier: {platformFee}</p>
                  {formData.providerEmployeeRange === "10+" && (
                    <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                      Company providers must submit verification documents after registration.
                    </p>
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`input-field focus-ring pl-10 pr-11 ${errors.password ? "border-red-500 bg-red-50/40" : ""}`}
                      placeholder="Minimum 10 characters"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="focus-ring absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-neutral-500 hover:bg-paper"
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password}</p>}
                  {formData.password && !errors.password && (
                    <div className="mt-2">
                      <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className={`h-full ${strengthBarColor} transition-all`}
                          style={{ width: strengthBarWidth }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-neutral-700">
                        Strength: {strengthLabel}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">Confirm Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`input-field focus-ring pl-10 pr-11 ${errors.confirmPassword ? "border-red-500 bg-red-50/40" : ""}`}
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      className="focus-ring absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-neutral-500 hover:bg-paper"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
                Create Account
              </Button>
            </form>

            <p className="mt-5 text-sm text-neutral-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary-700 hover:text-primary-800">
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
