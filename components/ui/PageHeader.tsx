"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon: Icon, iconColor, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              iconColor || "bg-gray-100 dark:bg-gray-800"
            )}
          >
            <Icon className={cn("h-5 w-5", iconColor ? "text-white" : "text-gray-600 dark:text-gray-400")} />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
