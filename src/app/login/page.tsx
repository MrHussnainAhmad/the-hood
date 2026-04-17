"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Eye, EyeOff, Home, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        remember: String(formData.remember),
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        const response = await fetch("/api/auth/session");
        const session = await response.json();

        toast.success("Welcome back");

        if (session?.user?.role === "ADMIN") router.push("/admin");
        else if (session?.user?.role === "PROVIDER") router.push("/provider");
        else router.push("/dashboard");

        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <main className="mx-auto grid min-h-screen max-w-[88rem] items-stretch gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <section className="relative hidden rounded-2xl border border-line/70 bg-[linear-gradient(165deg,#121417,#2f353b)] p-10 text-white lg:block">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-white/15">
              <Home className="h-5 w-5" />
            </span>
            <span className="font-display text-3xl">The Hood</span>
          </Link>

          <div className="mt-16">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Secure Access</p>
            <h1 className="mt-4 max-w-xl text-[clamp(2rem,4vw,3.5rem)] leading-tight">
              Continue managing services and orders in one workspace.
            </h1>
          </div>

          <div className="mt-12 grid gap-4">
            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <p className="text-sm font-semibold">Role-aware dashboard routing</p>
              <p className="mt-1 text-sm text-white/70">Consumer, provider and admin are redirected automatically.</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <p className="text-sm font-semibold">Session persistence</p>
              <p className="mt-1 text-sm text-white/70">Keep users signed in with the 30-day remember toggle.</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center rounded-2xl border border-line/70 bg-white/75 p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 lg:hidden">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>

            <div className="mb-7">
              <p className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.13em] text-accent-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Sign In
              </p>
              <h2 className="mt-4 text-4xl text-ink">Welcome back</h2>
              <p className="mt-2 text-sm text-neutral-600">Access your account to continue service workflows.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="email"
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
                <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`input-field focus-ring pl-10 pr-11 ${errors.password ? "border-red-500 bg-red-50/40" : ""}`}
                    placeholder="Enter your password"
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
              </div>

              <label className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={formData.remember}
                  onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                  className="h-4 w-4 rounded border-neutral-300 text-accent-600 focus:ring-accent-500"
                />
                Remember me for 30 days
              </label>

              <Button type="submit" className="mt-2 w-full" size="lg" isLoading={isLoading}>
                Sign In
              </Button>
            </form>

            <p className="mt-5 text-sm text-neutral-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-primary-700 hover:text-primary-800">
                Create one
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
