import Link from "next/link";
import { Home, Mail, PhoneCall } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line/70 bg-[rgba(255,255,255,0.52)] backdrop-blur-sm">
      <div className="page-shell py-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper">
                <Home className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-2xl text-ink">The Hood</p>
                <p className="-mt-1 text-[11px] uppercase tracking-[0.14em] text-neutral-600">
                  Service Marketplace
                </p>
              </div>
            </Link>
            <p className="mt-5 max-w-md text-sm text-neutral-700">
              Book local services with transparent workflow, trusted providers,
              and role-based workspaces built for real operations.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">
              Explore
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <Link href="/services" className="block text-neutral-800 transition hover:text-primary-700">
                Services
              </Link>
              <Link href="/register" className="block text-neutral-800 transition hover:text-primary-700">
                Create Account
              </Link>
              <Link href="/login" className="block text-neutral-800 transition hover:text-primary-700">
                Sign In
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-600">
              Contact
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-neutral-800">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary-600" />
                support@thehood.app
              </p>
              <p className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-primary-600" />
                +92 300 0000000
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-line/70 pt-4 text-center text-xs text-neutral-600">
          © {new Date().getFullYear()} The Hood. Final Year Project - Hussnain Ahmad.
        </div>
      </div>
    </footer>
  );
}
