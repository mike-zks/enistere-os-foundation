import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { RBAC_AUDIT_EVENTS } from '../rbac/rbac-audit-events';
import { RBAC_ERROR_CODES } from '../rbac/rbac-error-codes';
import { normalizeRoleCode } from '../permissions/permissions.constants';
import { CreateRoleInput } from './dto/create-role.input';
import { RoleView } from './models/role.model';
import { RolesRepository } from './roles.repository';

/**
 * Logique applicative des rôles (ADR-006). Opérations internes uniquement (pas de
 * CRUD public). Aucun rôle métier imposé.
 */
@Injectable()
export class RolesService {
  constructor(
    private readonly repository: RolesRepository,
    private readonly auditService: AuditService,
  ) {}

  async createRole(input: CreateRoleInput): Promise<RoleView> {
    const code = normalizeRoleCode(input.code);

    if (await this.repository.findByCode(code)) {
      throw new ConflictException({
        code: RBAC_ERROR_CODES.ROLE_CODE_ALREADY_EXISTS,
        message: 'Role code already exists.',
      });
    }

    const created = await this.repository.create({
      code,
      name: input.name.trim(),
      description: input.description ?? null,
      isSystem: input.isSystem ?? false,
    });

    return RolesService.toView(created);
  }

  async findByCode(code: string): Promise<RoleView | null> {
    const role = await this.repository.findByCode(normalizeRoleCode(code));
    return role ? RolesService.toView(role) : null;
  }

  async roleExists(code: string): Promise<boolean> {
    return (await this.repository.findByCode(normalizeRoleCode(code))) !== null;
  }

  async assignRoleToUser(userId: string, roleCode: string, actorId?: string | null): Promise<void> {
    const role = await this.requireByCode(roleCode);
    await this.repository.assignToUser(userId, role.id, actorId);
    await this.auditService.record({
      eventType: RBAC_AUDIT_EVENTS.ROLE_ASSIGNED,
      actorId: actorId ?? null,
      subjectId: userId,
      resourceType: 'user_role',
      metadata: { roleCode: role.code },
    });
  }

  async removeRoleFromUser(userId: string, roleCode: string, actorId?: string | null): Promise<void> {
    const role = await this.requireByCode(roleCode);
    await this.repository.removeFromUser(userId, role.id);
    await this.auditService.record({
      eventType: RBAC_AUDIT_EVENTS.ROLE_REMOVED,
      actorId: actorId ?? null,
      subjectId: userId,
      resourceType: 'user_role',
      metadata: { roleCode: role.code },
    });
  }

  /** Codes des rôles de l'utilisateur, triés. */
  async getUserRoleCodes(userId: string): Promise<string[]> {
    const roles = await this.repository.listByUser(userId);
    return roles.map((role) => role.code);
  }

  async userHasRole(userId: string, roleCode: string): Promise<boolean> {
    const role = await this.repository.findByCode(normalizeRoleCode(roleCode));
    if (!role) {
      return false;
    }
    return this.repository.userHasRole(userId, role.id);
  }

  private async requireByCode(roleCode: string): Promise<Role> {
    const role = await this.repository.findByCode(normalizeRoleCode(roleCode));
    if (!role) {
      throw new NotFoundException({
        code: RBAC_ERROR_CODES.ROLE_NOT_FOUND,
        message: 'Role not found.',
      });
    }
    return role;
  }

  private static toView(role: Role): RoleView {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
    };
  }
}
