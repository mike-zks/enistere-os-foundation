/* eslint-disable */
/**
 * Benchmark Argon2id contrôlé (ADR-039) — NON inclus dans la suite de tests.
 *
 * Mesure le temps moyen de `hash` et `verify` avec les paramètres courants, afin
 * d'aider à fixer des valeurs adaptées à l'ENVIRONNEMENT CIBLE. Les paramètres de
 * production ne doivent jamais être figés sans cette mesure sur la cible réelle.
 *
 * Usage : `npm run benchmark:argon2`
 * Variables : ARGON2_MEMORY_COST, ARGON2_TIME_COST, ARGON2_PARALLELISM, BENCH_ITERATIONS.
 */
import { Algorithm, hash, verify } from '@node-rs/argon2';

async function main(): Promise<void> {
  const memoryCost = Number(process.env.ARGON2_MEMORY_COST ?? 19456);
  const timeCost = Number(process.env.ARGON2_TIME_COST ?? 2);
  const parallelism = Number(process.env.ARGON2_PARALLELISM ?? 1);
  const iterations = Number(process.env.BENCH_ITERATIONS ?? 20);

  // Valeur fictive : jamais un mot de passe réel, jamais journalisé en clair ailleurs.
  const password = 'benchmark-password-not-a-secret';
  const options = { algorithm: Algorithm.Argon2id, memoryCost, timeCost, parallelism };

  const sampleHash = await hash(password, options); // warmup + échantillon pour verify

  let hashTotalMs = 0;
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await hash(password, options);
    hashTotalMs += Number(process.hrtime.bigint() - start) / 1e6;
  }

  let verifyTotalMs = 0;
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await verify(sampleHash, password);
    verifyTotalMs += Number(process.hrtime.bigint() - start) / 1e6;
  }

  const report = {
    node: process.version,
    platform: `${process.platform}/${process.arch}`,
    params: { memoryCost, timeCost, parallelism },
    iterations,
    avgHashMs: Number((hashTotalMs / iterations).toFixed(2)),
    avgVerifyMs: Number((verifyTotalMs / iterations).toFixed(2)),
  };

  console.log('Argon2id benchmark');
  console.log(JSON.stringify(report, null, 2));
  console.log('Paramètres à VALIDER sur l\'environnement cible avant production (ADR-039).');
}

void main();
