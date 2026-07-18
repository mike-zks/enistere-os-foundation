import { Injectable, computed, signal } from '@angular/core';

const MAX_PERMISSION_LENGTH = 128;
const PERMISSION_PATTERN = /^[a-z0-9:._-]+$/;
const ROLE_PATTERN = /^[a-z0-9:_-]+$/;

export interface AuthorizationSnapshot {
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

export interface AuthorizationInput {
  readonly roles?: readonly string[] | null;
  readonly permissions?: readonly string[] | null;
}

function normalizeValue(value: unknown, pattern: RegExp): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > MAX_PERMISSION_LENGTH) return null;
  if (normalized.includes('*')) return null;
  return pattern.test(normalized) ? normalized : null;
}

export function normalizeRole(value: unknown): string | null {
  return normalizeValue(value, ROLE_PATTERN);
}

export function normalizePermission(value: unknown): string | null {
  return normalizeValue(value, PERMISSION_PATTERN);
}

function normalizeList(values: readonly unknown[] | null | undefined, pattern: RegExp): readonly string[] {
  if (!values) return [];
  return Array.from(new Set(
    values
      .map((value) => normalizeValue(value, pattern))
      .filter((value): value is string => value !== null),
  )).sort();
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly _authorization = signal<AuthorizationSnapshot>({
    roles: [],
    permissions: [],
  });

  readonly authorization = computed(() => this._authorization());

  setAuthorization(input: AuthorizationInput): void {
    this._authorization.set({
      roles: normalizeList(input.roles, ROLE_PATTERN),
      permissions: normalizeList(input.permissions, PERMISSION_PATTERN),
    });
  }

  clear(): void {
    this._authorization.set({ roles: [], permissions: [] });
  }

  hasRole(role: string): boolean {
    const normalized = normalizeRole(role);
    return normalized !== null && this.authorization().roles.includes(normalized);
  }

  hasAnyRole(roles: readonly string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  hasPermission(permission: string): boolean {
    const normalized = normalizePermission(permission);
    return normalized !== null && this.authorization().permissions.includes(normalized);
  }

  hasAllPermissions(permissions: readonly string[]): boolean {
    return permissions.length > 0 && permissions.every((permission) => this.hasPermission(permission));
  }

  hasAnyPermission(permissions: readonly string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }
}
