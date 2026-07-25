/* eslint-disable */
/**
 * Orchestrateur de seed — **fichier stable, jamais remplacé par une capability**.
 *
 * Il ne contient aucune donnée : il exécute, dans l'ordre déclaré, les seeds
 * apportés par les capabilities composées (registre généré par la Factory dans
 * `prisma/seed/capability-seeds.ts`). Le Platform Baseline n'a rien à semer.
 *
 * Garanties attendues de chaque seed : idempotent (réexécutable sans effet de
 * bord), aucune identité ni mot de passe, aucune donnée métier.
 *
 * NON exécuté par `prisma migrate deploy` : lancer explicitement `npm run prisma:seed`.
 */
import { PrismaClient } from '@prisma/client';

import { CAPABILITY_SEEDS } from './seed/capability-seeds';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  if (CAPABILITY_SEEDS.length === 0) {
    console.log(JSON.stringify({ seed: 'base', status: 'nothing-to-seed' }));
    return;
  }
  for (const seed of CAPABILITY_SEEDS) {
    await seed.run({ prisma });
    console.log(JSON.stringify({ seed: seed.capability, order: seed.order, status: 'applied' }));
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
