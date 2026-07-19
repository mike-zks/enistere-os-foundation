import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";

/**
 * Fichier robots de la baseline `base`. Autorise l'indexation de `/` et `/status`
 * (pages publiques) ; protège l'API. Les routes privées apportées par les
 * capabilities composées (ex. `/protected/`, `/login`) sont ajoutées par la
 * variante que leur overlay substitue à ce fichier.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/status"],
        disallow: ["/api/"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
