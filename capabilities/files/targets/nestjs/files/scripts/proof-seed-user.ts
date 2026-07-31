/* eslint-disable */
/**
 * Provisionnement de comptes pour la PREUVE client OpenAPI (live e2e).
 *
 * N'IMPORTE PAS le code de preuve : il ne fait que préparer la base (il n'y a pas d'endpoint public
 * d'inscription). Crée deux comptes — un avec le rôle `administrator` (toutes permissions `files.*`,
 * issu de `prisma:seed`) et un SANS rôle (pour prouver le 403). Idempotent. Résultat machine sur stdout.
 *
 * Prérequis : `prisma migrate deploy` + `prisma:seed` (rôle administrator + permissions files.*).
 */
import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { PASSWORD_HASHER, PasswordHasher } from '../src/modules/auth/password/password-hasher';
import { PrismaService } from '../src/database/prisma.service';
import { RolesService } from '../src/modules/roles/roles.service';

const ADMIN_EMAIL = 'openapi-proof-admin@example.test';
const NOPERM_EMAIL = 'openapi-proof-noperm@example.test';
const PASSWORD = 'Proof-Sup3rSecret!';

async function main(): Promise<void> {
  process.env.LOG_STDERR = '1';
  const context = await NestFactory.createApplicationContext(AppModule, { logger: false });
  try {
    const prisma = context.get(PrismaService);
    const hasher = context.get<PasswordHasher>(PASSWORD_HASHER);
    const roles = context.get(RolesService);

    const emails = [ADMIN_EMAIL, NOPERM_EMAIL];
    // Idempotence : on repart d'un état propre pour ces comptes de preuve.
    await prisma.storedFile.deleteMany({ where: { owner: { email: { in: emails } } } });
    await prisma.user.deleteMany({ where: { email: { in: emails } } });

    const passwordHash = await hasher.hash(PASSWORD);
    const admin = await prisma.user.create({ data: { email: ADMIN_EMAIL, passwordHash } });
    await prisma.user.create({ data: { email: NOPERM_EMAIL, passwordHash } });

    // `administrator` est créé par le seed avec toutes les permissions files.* .
    await roles.assignRoleToUser(admin.id, 'administrator');

    console.log(
      JSON.stringify({
        ok: true,
        adminEmail: ADMIN_EMAIL,
        noPermEmail: NOPERM_EMAIL,
        password: PASSWORD,
        adminId: admin.id,
      }),
    );
  } finally {
    await context.close();
  }
}

void main().catch((error) => {
  console.error('proof-seed-user failed:', error?.message ?? error);
  process.exit(1);
});
