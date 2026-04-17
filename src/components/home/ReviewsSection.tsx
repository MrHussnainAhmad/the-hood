"use client";

import { useEffect, useMemo, useState } from "react";
import { Star, Quote, House, Paintbrush, Wrench, Droplets, Sparkles, Bug } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string };
  order: { service: { name: string; icon: string | null } };
}

const iconMap: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  palette: Paintbrush,
  wrench: Wrench,
  droplet: Droplets,
  bug: Bug,
  home: House,
};

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch("/api/reviews/latest", { cache: "no-store" });
        if (response.ok) {
          const data = (await response.json()) as Review[];
          setReviews(data);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchReviews();
  }, []);

  const average = useMemo(() => {
    if (reviews.length === 0) return "0.0";
    return (reviews.reduce((acc, item) => acc + item.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  if (isLoading) {
    return (
      <div className="card grid min-h-[320px] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-accent-600" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="card min-h-[320px]">
        <h3 className="text-2xl text-ink">Customer reviews are coming in soon</h3>
        <p className="mt-3 text-sm text-neutral-700">Complete service orders to populate this live section.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <article className="card">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Public Ratings</p>
        <div className="mt-4 flex items-end gap-3">
          <p className="text-5xl font-bold tracking-tight text-ink">{average}</p>
          <div className="pb-1">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="mt-1 text-xs text-neutral-600">{reviews.length} latest reviews</p>
          </div>
        </div>
      </article>

      <div className="grid gap-4 md:grid-cols-2">
        {reviews.slice(0, 4).map((review) => {
          const ServiceIcon = iconMap[(review.order.service.icon ?? "home").toLowerCase()] ?? House;
          return (
            <article key={review.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{review.user.name}</p>
                  <p className="text-xs text-neutral-600">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Quote className="h-5 w-5 text-neutral-300" />
              </div>
              <div className="mt-3 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={i < review.rating ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4 text-neutral-300"}
                  />
                ))}
              </div>
              {review.comment && (
                <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-neutral-700">{review.comment}</p>
              )}
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line bg-paper px-2.5 py-1.5">
                <ServiceIcon className="h-4 w-4 text-primary-600" />
                <span className="text-xs font-semibold text-neutral-700">{review.order.service.name}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

