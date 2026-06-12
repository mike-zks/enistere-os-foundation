/**
 * RHF ↔ Zod resolver bridge (RN 3 — forms & validation).
 *
 * A single import point so feature code wires Zod validation into React Hook
 * Form without depending on `@hookform/resolvers` paths directly. Used at the
 * `useForm({ resolver })` call site.
 *
 * Not part of the `node --test` build (it pulls RHF/resolver runtime); the
 * agnostic validation logic is covered via `validation.ts` / `form-errors.ts`.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodTypeAny } from 'zod';

export { zodResolver };

/** Builds an RHF resolver from a Zod schema (UX validation; backend stays authoritative). */
export function createZodResolver<TSchema extends ZodTypeAny>(schema: TSchema): ReturnType<typeof zodResolver> {
  return zodResolver(schema);
}
