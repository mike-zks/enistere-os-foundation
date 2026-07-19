/* eslint-disable */
/**
 * Seed structurel RBAC — **composable et idempotent** (ADR-006).
 *
 * Contribué par la capability RBAC via l'intégration `nestjs.prisma-seed` ; il est
 * exécuté par l'orchestrateur stable `prisma/seed.ts` dans l'ordre déclaré. Il ne
 * remplace aucun fichier central.
 *
 * Crée/maintient les permissions et rôles STRUCTURELS du core (`isSystem = true`) et
 * affecte les permissions structurelles au rôle `administrator`.
 *
 * Garanties :
 * - aucun utilisateur, aucun mot de passe, aucune affectation rôle→utilisateur ;
 * - aucun rôle/permission métier ;
 * - aucune permission accordée implicitement à tous les utilisateurs ;
 * - upsert idempotent (réexécutable sans effet de bord).
 */
import type { SeedContext } from './capability-seeds';

import {
  SYSTEM_PERMISSION_CODES,
  SYSTEM_ROLE_CODES,
  parsePermissionCode,
} from '../../src/permissions/permissions.constants';

export async function seedRbac({ prisma }: SeedContext): Promise<void> {
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

  // Rôle `user` structurel, volontairement SANS permission : aucune capacité n'est
  // accordée implicitement à tous les utilisateurs.
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
}
