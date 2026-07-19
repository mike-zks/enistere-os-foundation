/**
 * Overwrite policy for capability overlays.
 *
 * Replacing a file wholesale does not compose: two capabilities replacing the same
 * file silently fight, and the last one wins. The engine therefore **refuses**
 * `overwrite: true` on governed central files — schema, seed orchestrator,
 * generated registries, shared shells, published contracts — which must instead be
 * produced from declarative integrations.
 *
 * A deliberately small allowlist covers files that are genuinely *exclusive* to a
 * composition (there is exactly one legitimate variant, and no registry to render
 * into). Every entry carries a justification and stays reviewable.
 */

/** Central files a capability may never replace, with the composable alternative. */
export const GOVERNED_FILES = Object.freeze([
  { path: 'prisma/schema.prisma', use: "the declarative `nestjs.prisma-schema` fragment" },
  { path: 'prisma/seed.ts', use: "the composable `nestjs.prisma-seed` integration" },
  { path: 'prisma/seed/capability-seeds.ts', use: "the composable `nestjs.prisma-seed` integration" },
  { path: 'openapi/openapi.json', use: 'the OpenAPI generated from the composed application' },
  { path: 'src/app.module.ts', use: "the `nestjs.module` / `nestjs.global-guard` integrations" },
  { path: 'src/composition/capabilities.ts', use: 'the NestJS composition integrations' },
  { path: 'src/composition/capability-providers.tsx', use: "the `expo.provider` integration" },
  { path: 'src/app/providers/capability-providers.tsx', use: "the `nextjs.provider` integration" },
  { path: 'src/app/providers/app-providers.tsx', use: "the `nextjs.provider` integration" },
  { path: 'src/core/composition/public-nav.ts', use: "the `nextjs.public-nav-link` integration" },
  { path: 'src/core/composition/status-sections.tsx', use: "the `nextjs.status-section` integration" },
  { path: 'src/app/(public)/status/page.tsx', use: "the `nextjs.status-section` integration" },
  { path: 'src/app/(public)/layout.tsx', use: "the `nextjs.public-nav-link` integration" },
  { path: 'src/app/layout.tsx', use: "the `nextjs.provider` integration" },
  { path: 'app/_layout.tsx', use: "the `expo.provider` integration" },
]);

/**
 * Exclusive files a capability may replace, with the reason. Kept minimal: adding
 * an entry is a contract decision, not a convenience.
 */
export const OVERWRITE_ALLOWLIST = Object.freeze([
  {
    path: 'test/setup-e2e.ts',
    reason: 'Environnement de TEST global : les valeurs sont volontairement différentes des exemples documentés (Argon2 réduit, rate limits relâchés). Une seule variante peut exister par composition.',
  },
  {
    path: 'tsconfig.test.json',
    reason: "Périmètre de compilation des tests : la capability ajoute ses modules framework-agnostiques à la liste d'inclusion. Une seule variante par composition.",
  },
  {
    path: 'playwright.config.ts',
    reason: 'Harnais e2e navigateur : la capability ajoute son provisionnement (`globalSetup`). Une seule variante par composition.',
  },
  {
    path: 'e2e/helpers.ts',
    reason: 'Helpers e2e partagés du harnais (connexion UI). Une seule variante par composition.',
  },
  {
    path: 'src/app/robots.ts',
    reason: 'Politique robots : la capability protège les routes privées qu’elle ajoute. Une seule variante par composition.',
  },
  {
    path: 'src/query/query-client.ts',
    reason: "Politique de retry du client de données mobile : la capability Auth interdit le retry d'un 401 (pont 401). Une seule variante par composition.",
  },
  {
    path: 'src/query/index.ts',
    reason: 'Surface publique du module data mobile : expose les hooks authentifiés quand Auth est composée. Une seule variante par composition.',
  },
  {
    path: 'app/index.tsx',
    reason: "Route d'entrée mobile : Auth la remplace par la porte de redirection selon l'état de session. Une seule variante par composition.",
  },
]);

const governed = new Map(GOVERNED_FILES.map((entry) => [entry.path, entry]));
const allowed = new Set(OVERWRITE_ALLOWLIST.map((entry) => entry.path));

/**
 * Validates the `overwrite` usage of an overlay's file entries.
 * Returns the list of issues (empty when the overlay complies).
 */
export function validateOverwriteUsage(files) {
  const issues = [];
  for (const [index, entry] of (files ?? []).entries()) {
    const destination = entry.destination ?? '';
    const governedEntry = governed.get(destination);
    if (governedEntry) {
      issues.push(`files[${index}]: ${destination} is a governed central file and cannot be supplied by a file operation — use ${governedEntry.use}`);
      continue;
    }
    if (entry?.overwrite !== true) continue;
    if (!allowed.has(destination)) {
      issues.push(`files[${index}]: ${destination} is not in the overwrite allowlist — render it from a declarative integration, or justify it in factory/engine/overwrite-policy.mjs`);
    }
  }
  return issues;
}
