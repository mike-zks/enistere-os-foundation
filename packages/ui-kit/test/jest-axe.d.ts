/** Déclaration minimale locale pour `jest-axe` (le paquet ne fournit pas de types ; on n'utilise que `axe`). */
declare module 'jest-axe' {
  export interface AxeViolation {
    id: string;
    description?: string;
    nodes?: unknown[];
  }
  export interface AxeResults {
    violations: AxeViolation[];
  }
  export function axe(container: Element | string, options?: unknown): Promise<AxeResults>;
  export const toHaveNoViolations: unknown;
}
