"use client";

import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
  variant?: "spinner" | "skeleton" | "dots";
  text?: string;
}

export function LoadingState({ className, variant = "spinner", text }: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 py-12", className)}>
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-500"
              style={{
                animation: `bounce 1.4s infinite ease-in-out both`,
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
        {text && <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16", className)}>
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-[3px] border-gray-200 dark:border-gray-700" />
        <div className="absolute inset-0 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin" />
      </div>
      {text && <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  );
}

/* Skeleton card for dashboard / module grids */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5", className)}>
      <div className="flex items-center gap-4">
        <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-5 w-32" />
        </div>
      </div>
    </div>
  );
}

/* Skeleton stat card */
export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl p-4", className)}>
      <div className="skeleton h-3 w-20 mb-2" />
      <div className="skeleton h-5 w-28" />
    </div>
  );
}
