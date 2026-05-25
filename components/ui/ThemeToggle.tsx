"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800", className)}>
        <div className="w-7 h-7 rounded-lg" />
        <div className="w-7 h-7 rounded-lg" />
        <div className="w-7 h-7 rounded-lg" />
      </div>
    );
  }

  const options = [
    { value: "light", icon: Sun,     title: "Hell"   },
    { value: "dark",  icon: Moon,    title: "Dunkel" },
    { value: "system",icon: Monitor, title: "System" },
  ] as const;

  return (
    <div className={cn("flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800", className)}>
      {options.map(({ value, icon: Icon, title }) => (
        <button
          key={value}
          title={title}
          onClick={() => setTheme(value)}
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-lg transition-all",
            theme === value
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
