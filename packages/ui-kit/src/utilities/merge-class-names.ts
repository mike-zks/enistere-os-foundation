/** Fusion minimale de classes (type clsx, zéro dépendance). Ignore les valeurs falsy. */
export type ClassValue = string | number | false | null | undefined;

export function mergeClassNames(...values: ClassValue[]): string {
  return values
    .filter((value): value is string | number => value !== false && value !== null && value !== undefined && value !== '')
    .map(String)
    .join(' ');
}
