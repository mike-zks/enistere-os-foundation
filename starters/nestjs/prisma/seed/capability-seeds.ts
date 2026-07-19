// Point d'intégration central des seeds de capabilities (contrat de composition Factory).
//
// Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
// overlays déclarent leur seed via l'intégration connue `nestjs.prisma-seed`
// (importPath, symbol, order) et la Factory régénère ce registre de manière
// déterministe. La baseline `base` n'enregistre aucun seed.
import type { PrismaClient } from '@prisma/client';

/** Contexte fourni à chaque seed de capability. */
export interface SeedContext {
  readonly prisma: PrismaClient;
}

/** Seed d'une capability : idempotent, sans identité ni donnée métier. */
export interface CapabilitySeed {
  readonly capability: string;
  readonly order: number;
  readonly run: (context: SeedContext) => Promise<void>;
}

/** Seeds apportés par les capabilities composées, dans l'ordre déclaré. */
export const CAPABILITY_SEEDS: readonly CapabilitySeed[] = [];
