import { join } from "node:path";
import type { NextConfig } from "next";

/**
 * En-têtes de sécurité de base appliqués à TOUTES les routes (Web 1).
 *
 * Volontairement minimal :
 * - Pas de Content-Security-Policy ici : la CSP sera définie en V2 (nonces + sources réelles),
 *   voir `docs/SECURITY.md`. Une CSP incomplète donnerait une fausse impression de protection.
 * - `poweredByHeader: false` retire l'en-tête `X-Powered-By`.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Image Docker (Cloud Core 5) : sortie autonome (serveur minimal + dépendances tracées, y compris les
  // paquets de workspace `@enistere/*`). `outputFileTracingRoot` = racine du monorepo pour que le tracing
  // inclue `packages/*` et `cores/ui-kit`. N'affecte ni le dev (`next dev`) ni les tests `node:test`.
  output: "standalone",
  outputFileTracingRoot: join(import.meta.dirname, "..", ".."),
  // Résolution des imports de style nodenext (`./x.js` → `./x.ts`/`.tsx`) côté Turbopack, afin
  // d'utiliser une convention d'import UNIQUE dans tout le code (cohérente avec `node:test`).
  experimental: {
    extensionAlias: { ".js": [".ts", ".tsx", ".js"] },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
