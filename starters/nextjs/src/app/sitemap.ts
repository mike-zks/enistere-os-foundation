import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";

/**
 * Sitemap public du socle. N'inclut que les pages indexables (`/` et `/status`).
 * Les routes protégées (`/protected/**`, `/api/**`) et l'interface de connexion
 * (`/login`) sont exclues du sitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: APP_URL,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${APP_URL}/status`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];
}
