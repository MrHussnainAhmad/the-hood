"use client";

import { useState, FormEvent } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { CreditCard, Lock, Shield, CircleCheck } from "lucide-react";

interface CheckoutFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export default function CheckoutForm({
  amount,
  onSuccess,
  onCancel,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Payment system is loading...");
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Payment failed");
        console.error("Payment error:", error);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast.success("Payment successful!");
        onSuccess(paymentIntent.id);
      }
    } catch (error: unknown) {
      console.error("Payment exception:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-line bg-paper/70 p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">
            Total Amount
          </span>
          <CreditCard className="h-5 w-5 text-primary-600" />
        </div>
        <p className="text-3xl font-bold text-ink sm:text-4xl">
          ${amount.toFixed(2)}
        </p>
        <p className="mt-2 text-xs text-neutral-600">
          One-time payment only. No hidden fees.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-neutral-800">
          Payment Details
        </label>
        <div className="rounded-xl border border-line bg-white p-3 sm:p-4">
          <PaymentElement
            options={{
              layout: {
                type: "tabs",
                defaultCollapsed: false,
              },
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-xl border border-line bg-paper/65 p-3 sm:grid-cols-3">
        <div className="flex items-center gap-2 text-neutral-700">
          <Lock className="h-4 w-4" />
          <span className="text-xs font-medium">SSL Encrypted</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-700">
          <Shield className="h-4 w-4" />
          <span className="text-xs font-medium">PCI Compliant</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-700">
          <CircleCheck className="h-4 w-4" />
          <span className="text-xs font-medium">Verified by Stripe</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-1 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:flex-1"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="w-full sm:flex-1"
          disabled={!stripe || isLoading}
          isLoading={isLoading}
        >
          {isLoading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>

      <p className="flex items-center justify-center gap-1 text-center text-xs text-neutral-500">
        <Lock className="h-3 w-3" />
        Secured by Stripe. Your payment info stays encrypted.
      </p>
    </form>
  );
}
