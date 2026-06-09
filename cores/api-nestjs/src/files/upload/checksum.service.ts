import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

/** Calcul d'empreinte d'intégrité du contenu (SHA-256). N'est pas un mécanisme d'authentification. */
@Injectable()
export class ChecksumService {
  sha256Hex(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}
