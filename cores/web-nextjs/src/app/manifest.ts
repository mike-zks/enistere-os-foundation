import type { MetadataRoute } from "next";

/**
 * Manifeste Web minimal (route `manifest.webmanifest`). `theme_color`/`background_color` sont la
 * couleur de chrome PWA (pas la palette de design, qui reste dans le UI Kit). Icônes : V2.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Enistère — Web Core",
    short_name: "Enistère",
    description: "Starter minimal du Web Core Enistère.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [],
  };
}
