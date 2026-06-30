"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes v0.4 renders a synchronous <script> for SSR theme initialisation.
// React 19 emits a false-positive warning because the script intentionally does
// NOT re-execute on the client (the theme is already applied via SSR). Suppress
// only that specific message to keep the console clean.
if (typeof window !== "undefined") {
  const _err = console.error.bind(console);
  console.error = (...args: Parameters<typeof console.error>) => {
    if (typeof args[0] === "string" && args[0].startsWith("Encountered a script tag")) return;
    _err(...args);
  };
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
