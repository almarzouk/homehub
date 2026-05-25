import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HomeHub",
    short_name: "HomeHub",
    description: "Küche · Vorrat · Finanzen – alles in einer App",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#1e40af",
    background_color: "#f9fafb",
    lang: "de",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    screenshots: [],
    categories: ["utilities", "lifestyle"],
  };
}
