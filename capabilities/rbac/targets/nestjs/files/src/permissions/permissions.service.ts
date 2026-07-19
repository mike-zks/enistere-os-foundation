import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Permission } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { RBAC_AUDIT_EVENTS } from '../rbac/rbac-audit-events';
import { RBAC_ERROR_CODES } from '../rbac/rbac-error-codes';
import { CreatePermissionInput } from './dto/create-permission.input';
import { PermissionView } from './models/permission.model';
import { PermissionsRepository } from './permissions.repository';
import { isValidPermissionCode, parsePermissionCode } from './permissions.constants';

/**
 * Logique applicative des permissions fines (ADR-006). Aucune permission métier.
 * Expose des codes et des contrats internes, jamais le modèle Prisma brut.
 */
@Injectable()
export class PermissionsService {
  constructor(
    private readonly repository: PermissionsRepository,
    private readonly auditService: AuditService,
  ) {}

  async createPermission(input: CreatePermissionInput): Promise<PermissionView> {
    // Les codes de permission sont déjà attendus en minuscules (`resource.action`) ;
    // on ne normalise pas la casse pour rejeter explicitement un code mal formé.
    const code = input.code.trim();
    const parsed = parsePermissionCode(code);

    if (!parsed) {
      throw new BadRequestException({
        code: RBAC_ERROR_CODES.INVALID_PERMISSION_CODE,
        message: 'Invalid permission code.',
      });
    }

    if (await this.repository.findByCode(code)) {
      throw new ConflictException({
        code: RBAC_ERROR_CODES.PERMISSION_CODE_ALREADY_EXISTS,
        message: 'Permission code already exists.',
      });
    }

    const created = await this.repository.create({
      code,
      resource: parsed.resource,
      action: parsed.action,
      description: input.description ?? null,
      isSystem: input.isSystem ?? false,
    });

    return PermissionsService.toView(created);
  }

  async assignToRole(roleId: string, permissionCode: string, actorId?: string | null): Promise<void> {
    const permission = await this.requireByCode(permissionCode);
    await this.repository.assignToRole(roleId, permission.id, actorId);
    await this.auditService.record({
      eventType: RBAC_AUDIT_EVENTS.PERMISSION_ASSIGNED_TO_ROLE,
      actorId: actorId ?? null,
      resourceType: 'role_permission',
      resourceId: roleId,
      metadata: { roleId, permissionCode: permission.code },
    });
  }

  async removeFromRole(roleId: string, permissionCode: string, actorId?: string | null): Promise<void> {
    const permission = await this.requireByCode(permissionCode);
    await this.repository.removeFromRole(roleId, permission.id);
    await this.auditService.record({
      eventType: RBAC_AUDIT_EVENTS.PERMISSION_REMOVED_FROM_ROLE,
      actorId: actorId ?? null,
      resourceType: 'role_permission',
      resourceId: roleId,
      metadata: { roleId, permissionCode: permission.code },
    });
  }

  async listRolePermissionCodes(roleId: string): Promise<string[]> {
    const permissions = await this.repository.listByRole(roleId);
    return permissions.map((permission) => permission.code);
  }

  /** Union triée et dédupliquée des permissions des rôles de l'utilisateur. */
  getEffectivePermissions(userId: string): Promise<string[]> {
    return this.repository.effectivePermissionCodes(userId);
  }

  /** Vérifie que TOUTES les permissions requises sont possédées (logique AND). */
  async hasPermissions(userId: string, required: readonly string[]): Promise<boolean> {
    if (required.length === 0) {
      return true;
    }
    const effective = new Set(await this.getEffectivePermissions(userId));
    return required.every((code) => effective.has(code));
  }

  private async requireByCode(permissionCode: string): Promise<Permission> {
    const code = permissionCode.trim();
    if (!isValidPermissionCode(code)) {
      throw new BadRequestException({
        code: RBAC_ERROR_CODES.INVALID_PERMISSION_CODE,
        message: 'Invalid permission code.',
      });
    }
    const permission = await this.repository.findByCode(code);
    if (!permission) {
      throw new NotFoundException({
        code: RBAC_ERROR_CODES.PERMISSION_NOT_FOUND,
        message: 'Permission not found.',
      });
    }
    return permission;
  }

  private static toView(permission: Permission): PermissionView {
    return {
      id: permission.id,
      code: permission.code,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
      isSystem: permission.isSystem,
    };
  }
}
