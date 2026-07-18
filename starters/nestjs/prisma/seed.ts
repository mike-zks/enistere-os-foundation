/* eslint-disable */
/**
 * Seed structurel RBAC idempotent (ADR-006, Auth 5).
 *
 * Crée/maintient les permissions et rôles STRUCTURELS du core (isSystem = true) et
 * affecte les permissions structurelles au rôle `administrator`.
 *
 * Garanties :
 * - aucun utilisateur, aucun mot de passe, aucune affectation rôle→utilisateur ;
 * - aucun rôle/permission métier ;
 * - upsert idempotent (réexécutable sans effet de bord) ;
 * - NON exécuté par `prisma migrate deploy` (production) ; lancer explicitement
 *   `npm run prisma:seed` (ou `prisma db seed`).
 *
 * Optionnel pour les projets dérivés, qui peuvent définir leurs propres rôles/permissions.
 */
import { PrismaClient } from '@prisma/client';

import {
  SYSTEM_PERMISSION_CODES,
  SYSTEM_ROLE_CODES,
  parsePermissionCode,
} from '../src/permissions/permissions.constants';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  for (const code of SYSTEM_PERMISSION_CODES) {
    const parsed = parsePermissionCode(code);
    if (!parsed) {
      continue;
    }
    await prisma.permission.upsert({
      where: { code },
      create: { code, resource: parsed.resource, action: parsed.action, isSystem: true },
      update: { isSystem: true },
    });
  }

  const administrator = await prisma.role.upsert({
    where: { code: SYSTEM_ROLE_CODES.ADMINISTRATOR },
    create: { code: SYSTEM_ROLE_CODES.ADMINISTRATOR, name: 'Administrator', isSystem: true },
    update: { isSystem: true },
  });

  await prisma.role.upsert({
    where: { code: SYSTEM_ROLE_CODES.USER },
    create: { code: SYSTEM_ROLE_CODES.USER, name: 'User', isSystem: true },
    update: { isSystem: true },
  });

  const permissions = await prisma.permission.findMany({
    where: { code: { in: [...SYSTEM_PERMISSION_CODES] } },
  });

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: administrator.id, permissionId: permission.id } },
      create: { roleId: administrator.id, permissionId: permission.id },
      update: {},
    });
  }

  console.log('RBAC structural seed applied (idempotent).');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
