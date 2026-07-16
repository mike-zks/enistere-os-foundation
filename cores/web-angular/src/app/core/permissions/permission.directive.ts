import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { PermissionService } from './permission.service';

export type PermissionMatchMode = 'all' | 'any';

export interface PermissionRequirement {
  readonly permission?: string;
  readonly permissions?: readonly string[];
  readonly role?: string;
  readonly roles?: readonly string[];
  readonly mode?: PermissionMatchMode;
}

type PermissionDirectiveInput = string | readonly string[] | PermissionRequirement | null | undefined;

function isPermissionArray(value: PermissionDirectiveInput): value is readonly string[] {
  return Array.isArray(value);
}

@Directive({
  selector: '[enisterePermission]',
  standalone: true,
})
export class PermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly permissionService = inject(PermissionService);

  readonly enisterePermission = input<PermissionDirectiveInput>(null);
  readonly enisterePermissionMode = input<PermissionMatchMode>('all');

  private hasView = false;

  constructor() {
    effect(() => {
      this.permissionService.authorization();
      this.updateView();
    });
  }

  private updateView(): void {
    const allowed = this.isAllowed(this.enisterePermission(), this.enisterePermissionMode());
    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
      return;
    }
    if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }

  private isAllowed(inputValue: PermissionDirectiveInput, defaultMode: PermissionMatchMode): boolean {
    if (typeof inputValue === 'string') {
      return this.permissionService.hasPermission(inputValue);
    }

    if (isPermissionArray(inputValue)) {
      return defaultMode === 'any'
        ? this.permissionService.hasAnyPermission(inputValue)
        : this.permissionService.hasAllPermissions(inputValue);
    }

    if (!inputValue) return false;

    const mode = inputValue.mode ?? defaultMode;
    const checks = [
      ...(inputValue.role ? [this.permissionService.hasRole(inputValue.role)] : []),
      ...(inputValue.roles?.map((role) => this.permissionService.hasRole(role)) ?? []),
      ...(inputValue.permission ? [this.permissionService.hasPermission(inputValue.permission)] : []),
      ...(inputValue.permissions?.map((permission) => this.permissionService.hasPermission(permission)) ?? []),
    ];

    if (checks.length === 0) return false;
    return mode === 'any' ? checks.some(Boolean) : checks.every(Boolean);
  }
}
