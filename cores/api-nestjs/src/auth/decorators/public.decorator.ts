import { SetMetadata } from '@nestjs/common';

/** Clé de metadata stable marquant une route comme publique (auth non requise). */
export const IS_PUBLIC_KEY = 'auth:isPublic';

/**
 * Marque une route (ou un contrôleur) comme publique : elle contourne uniquement
 * le `JwtAuthGuard`. Ce décorateur ne doit pas être utilisé pour contourner de
 * futurs guards de sécurité (RBAC, permissions).
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
