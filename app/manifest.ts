import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "HomeHub",
    short_name: "HomeHub",
    description: "Küche · Vorrat · Finanzen – alles in einer App",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#1e40af",
    background_color: "#f9fafb",
    lang: "de",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    screenshots: [],
    categories: ["utilities", "lifestyle"],
  };
}
