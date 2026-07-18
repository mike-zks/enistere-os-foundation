import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";

/**
 * Fichier robots du socle. Autorise l'indexation de `/` et `/status` (pages publiques) ;
 * protège explicitement les routes privées et l'API.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/status"],
        disallow: ["/protected/", "/api/", "/login"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
