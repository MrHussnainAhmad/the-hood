"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Star, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function ReviewPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.orderId;

  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          rating,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to submit review");
        return;
      }

      toast.success("Thank you for your review");
      router.push(`/orders/${orderId}`);
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingLabel = (value: number) => {
    switch (value) {
      case 1:
        return { label: "Poor", color: "text-rose-700" };
      case 2:
        return { label: "Fair", color: "text-orange-700" };
      case 3:
        return { label: "Good", color: "text-amber-700" };
      case 4:
        return { label: "Very Good", color: "text-lime-700" };
      case 5:
        return { label: "Excellent", color: "text-emerald-700" };
      default:
        return null;
    }
  };

  const currentRating = getRatingLabel(hoveredRating || rating);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="section-space pb-12">
        <div className="page-shell max-w-2xl">
          <Link
            href={`/orders/${orderId}`}
            className="focus-ring mb-6 inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-paper px-3 text-sm font-semibold text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Order
          </Link>

          <section className="card">
            <div className="mb-8 text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary-700">
                <Sparkles className="h-3.5 w-3.5" />
                Feedback
              </p>
              <h1 className="mt-4 text-[clamp(1.7rem,4vw,2.8rem)] text-ink">Rate Your Experience</h1>
              <p className="mt-2 text-sm text-neutral-600">Your review helps us maintain service quality.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <label className="mb-4 block text-center text-sm font-semibold text-neutral-700">
                  How would you rate this service?
                </label>
                <div className="mb-5 flex justify-center gap-2 sm:gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                      className="focus-ring rounded-lg p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-11 w-11 transition-all sm:h-12 sm:w-12 ${
                          star <= (hoveredRating || rating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-neutral-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {currentRating && (
                  <div className="text-center">
                    <p className={`text-lg font-semibold ${currentRating.color}`}>{currentRating.label}</p>
                  </div>
                )}
              </div>

              <div className="mb-8">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.13em] text-neutral-600">
                  Comment (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input-field min-h-[130px]"
                  placeholder="Share your service experience"
                  rows={5}
                  maxLength={500}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                  <p>Help others make informed decisions.</p>
                  <p>{comment.length}/500</p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={rating === 0} isLoading={isLoading}>
                <Star className="h-4 w-4" />
                Submit Review
              </Button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
