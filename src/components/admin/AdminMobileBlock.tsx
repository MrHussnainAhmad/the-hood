"use client";

import { useEffect, useState } from "react";
import { Shield, Smartphone } from "lucide-react";
import Link from "next/link";

export default function AdminMobileBlock() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkPlatform = () => {
      if (typeof window !== "undefined") {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileDevice =
          /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
            userAgent
          );
        setIsMobile(isMobileDevice);
      }
    };

    checkPlatform();
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-display font-bold text-neutral-900 mb-3">
          Access Restricted
        </h1>

        <div className="mb-6">
          <Smartphone className="w-16 h-16 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-700 mb-2">
            The Admin Panel is only accessible from desktop browsers.
          </p>
          <p className="text-sm text-neutral-600">
            Please use a computer to access administrative features.
          </p>
        </div>

        <div className="bg-neutral-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-neutral-600">
            For security and usability reasons, admin functions require a
            larger screen and are not available on mobile devices.
          </p>
        </div>

        <Link
          href="/"
          className="focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
