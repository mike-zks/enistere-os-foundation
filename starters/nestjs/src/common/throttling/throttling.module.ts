import { Global, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { CAPABILITY_THROTTLERS } from '../../composition/capabilities';

function readPositiveInt(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Configuration centralisée et globale des throttlers nommés (TTL en millisecondes).
 *
 * La baseline `base` n'enregistre aucun throttler : les fenêtres nommées sont
 * déclarées par les capabilities composées (fichier de composition généré par la
 * Factory) et chaque route sélectionne la sienne via `@SkipThrottle`. Les valeurs
 * sont lues depuis l'environnement déclaré par l'overlay (`.env.example`), avec
 * repli sur les valeurs par défaut déclarées.
 * Stockage en mémoire (mono-instance) ; une stratégie Redis distribuée sera
 * requise en multi-instances.
 */
@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot(
      CAPABILITY_THROTTLERS.map((spec) => ({
        name: spec.name,
        ttl: readPositiveInt(spec.ttlSecondsEnv, spec.defaultTtlSeconds) * 1000,
        limit: readPositiveInt(spec.limitEnv, spec.defaultLimit),
      })),
    ),
  ],
  exports: [ThrottlerModule],
})
export class ThrottlingModule {}
