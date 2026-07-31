import { Algorithm, hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import { authConfig } from '../auth.config';
import { PasswordHasher } from './password-hasher';

/**
 * Implémentation Argon2id du `PasswordHasher` (ADR-039).
 *
 * Les paramètres (mémoire, temps, parallélisme) proviennent de la configuration
 * validée et centralisée. Le mot de passe et le hash ne sont jamais journalisés.
 */
@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  private readonly memoryCost: number;
  private readonly timeCost: number;
  private readonly parallelism: number;

  constructor(@Inject(authConfig.KEY) config: ConfigType<typeof authConfig>) {
    this.memoryCost = config.argon2MemoryCost;
    this.timeCost = config.argon2TimeCost;
    this.parallelism = config.argon2Parallelism;
  }

  async hash(plainPassword: string): Promise<string> {
    try {
      return await argon2Hash(plainPassword, {
        algorithm: Algorithm.Argon2id,
        memoryCost: this.memoryCost,
        timeCost: this.timeCost,
        parallelism: this.parallelism,
      });
    } catch {
      // Erreur interne non sensible : ne jamais exposer le mot de passe.
      throw new Error('Password hashing failed.');
    }
  }

  async verify(hash: string, plainPassword: string): Promise<boolean> {
    try {
      return await argon2Verify(hash, plainPassword);
    } catch {
      // Hash invalide ou illisible : échec de vérification, sans détail sensible.
      return false;
    }
  }

  /**
   * Détecte un hash dont l'algorithme ou les paramètres ne correspondent plus
   * à la configuration courante, en parsant la chaîne PHC `$argon2id$v=..$m=..,t=..,p=..$..`.
   */
  needsRehash(hash: string): boolean {
    const match = /^\$argon2(id|i|d)\$v=\d+\$m=(\d+),t=(\d+),p=(\d+)\$/.exec(hash);

    if (!match) {
      return true;
    }

    const [, variant, memory, time, parallelism] = match;

    if (variant !== 'id') {
      return true;
    }

    return (
      Number(memory) !== this.memoryCost ||
      Number(time) !== this.timeCost ||
      Number(parallelism) !== this.parallelism
    );
  }
}
