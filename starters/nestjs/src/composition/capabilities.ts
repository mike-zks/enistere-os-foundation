// Point d'intégration central des capabilities (contrat de composition Factory).
//
// Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
// overlays déclarent leurs modules, guards globaux et throttlers nommés via des
// intégrations connues (`nestjs.module`, `nestjs.global-guard`,
// `nestjs.throttler`) et la Factory régénère ce fichier de manière déterministe.
// La baseline `base` n'enregistre rien : ces listes restent vides.
import type { CanActivate, DynamicModule, ForwardReference, Type } from '@nestjs/common';

/** Throttler nommé déclaré par une capability (TTL en secondes, lu depuis l'environnement). */
export interface CapabilityThrottlerSpec {
  name: string;
  limitEnv: string;
  defaultLimit: number;
  ttlSecondsEnv: string;
  defaultTtlSeconds: number;
}

/** Modules apportés par les capabilities composées (importés par AppModule). */
export const CAPABILITY_MODULES: Array<Type | DynamicModule | ForwardReference> = [];

/** Guards globaux apportés par les capabilities composées, dans l'ordre. */
export const CAPABILITY_GLOBAL_GUARDS: Array<Type<CanActivate>> = [];

/** Throttlers nommés apportés par les capabilities composées. */
export const CAPABILITY_THROTTLERS: CapabilityThrottlerSpec[] = [];
