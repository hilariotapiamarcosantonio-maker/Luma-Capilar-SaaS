"use client";

import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl border border-crm-line bg-crm-surface p-4 space-y-3", className)}>
      <div className="h-4 w-2/3 rounded-md bg-crm-surface2" />
      <div className="h-3 w-1/2 rounded-md bg-crm-surface2" />
      <div className="h-3 w-3/4 rounded-md bg-crm-surface2" />
      <div className="h-10 w-full rounded-lg bg-crm-surface2" />
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonMetric({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl border border-crm-line bg-crm-surface p-5 space-y-2", className)}>
      <div className="h-3 w-1/3 rounded bg-crm-surface2" />
      <div className="h-8 w-2/3 rounded-md bg-crm-surface2" />
    </div>
  );
}
