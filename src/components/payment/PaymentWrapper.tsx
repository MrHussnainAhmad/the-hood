"use client";

import { Elements } from "@stripe/react-stripe-js";
import { StripeElementsOptions } from "@stripe/stripe-js";
import { getStripe } from "@/lib/stripe-client";
import CheckoutForm from "./CheckoutForm";

interface PaymentWrapperProps {
  amount: number;
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export default function PaymentWrapper({
  amount,
  clientSecret,
  onSuccess,
  onCancel,
}: PaymentWrapperProps) {
  const stripePromise = getStripe();

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: "flat",
      labels: "floating",
      variables: {
        colorPrimary: "#b85c38",
        colorBackground: "#ffffff",
        colorText: "#121417",
        colorDanger: "#dc2626",
        fontFamily: "Manrope, Inter, system-ui, sans-serif",
        fontSizeBase: "15px",
        spacingUnit: "4px",
        borderRadius: "12px",
        fontWeightNormal: "500",
      },
      rules: {
        ".Tab": {
          border: "1px solid #d6d1c5",
          backgroundColor: "#f6f3eb",
          boxShadow: "none",
        },
        ".Tab:hover": {
          border: "1px solid #b85c38",
        },
        ".Tab--selected": {
          border: "1px solid #b85c38",
          backgroundColor: "#f8ede8",
          boxShadow: "0 0 0 2px rgba(184, 92, 56, 0.12)",
        },
        ".Input": {
          border: "1px solid #d6d1c5",
          backgroundColor: "#ffffff",
          boxShadow: "none",
          padding: "12px",
        },
        ".Input:focus": {
          border: "1px solid #2f5d50",
          boxShadow: "0 0 0 3px rgba(47, 93, 80, 0.15)",
          outline: "none",
        },
        ".Label": {
          fontWeight: "600",
          fontSize: "13px",
          marginBottom: "8px",
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
