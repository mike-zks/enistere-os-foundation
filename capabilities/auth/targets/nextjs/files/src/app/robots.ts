import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";

/**
 * Fichier robots de la composition `base + auth`. Ce fichier REMPLACE (remplacement
 * déclaré par l'overlay Auth) la variante de la baseline pour protéger l'espace
 * protégé et l'interface de connexion en plus de l'API.
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
