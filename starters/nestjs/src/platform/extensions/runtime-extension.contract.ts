import { Injectable } from '@nestjs/common';

export const API_EXTENSION_CONTRACT_VERSION = 'api-extension/2.0.0' as const;
export const API_EXTENSION_POINTS = ['authentication', 'authorization', 'files', 'events'] as const;

export type ApiExtensionPoint = (typeof API_EXTENSION_POINTS)[number];

/**
 * Contrat neutre entre le Platform Baseline et les capabilities. Le runtime ne
 * fournit aucune politique métier par défaut : il expose uniquement des ports
 * versionnés que les adapters de capabilities peuvent implémenter.
 */
export interface RuntimeExtension {
  readonly point: ApiExtensionPoint;
  readonly contractVersion: string;
  readonly providerId: string;
}

export interface AuthenticationHook extends RuntimeExtension {
  readonly point: 'authentication';
  authenticate(input: unknown): Promise<unknown>;
}

export interface AuthorizationHook extends RuntimeExtension {
  readonly point: 'authorization';
  authorize(input: unknown): Promise<boolean>;
}

export interface FileHook extends RuntimeExtension {
  readonly point: 'files';
  execute(input: unknown): Promise<unknown>;
}

export interface EventHook extends RuntimeExtension {
  readonly point: 'events';
  publish(input: unknown): Promise<void>;
}

/**
 * Registre strict : un seul provider actif par point, version exacte et aucune
 * activation implicite. Une capability absente reste réellement absente.
 */
@Injectable()
export class RuntimeExtensionRegistry {
  private readonly extensions = new Map<ApiExtensionPoint, RuntimeExtension>();

  register(extension: RuntimeExtension): void {
    if (extension.contractVersion !== API_EXTENSION_CONTRACT_VERSION) {
      throw new Error(
        `Unsupported ${extension.point} extension contract: ${extension.contractVersion}`,
      );
    }
    if (this.extensions.has(extension.point)) {
      throw new Error(`Extension point already registered: ${extension.point}`);
    }
    this.extensions.set(extension.point, extension);
  }

  resolve<T extends RuntimeExtension>(point: ApiExtensionPoint): T | undefined {
    return this.extensions.get(point) as T | undefined;
  }

  registeredPoints(): ApiExtensionPoint[] {
    return API_EXTENSION_POINTS.filter((point) => this.extensions.has(point));
  }
}
