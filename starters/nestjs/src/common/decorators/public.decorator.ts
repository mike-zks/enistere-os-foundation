import { SetMetadata } from '@nestjs/common';

/** Clé de metadata stable marquant une route comme publique (auth non requise). */
export const IS_PUBLIC_KEY = 'auth:isPublic';

/**
 * Marque une route (ou un contrôleur) comme publique. Contrat de composition de
 * la baseline : sans capability d'authentification composée, ce décorateur est
 * neutre ; lorsque Auth est composée, son guard global respecte cette metadata.
 * Ce décorateur ne doit pas être utilisé pour contourner d'autres guards de
 * sécurité (RBAC, permissions).
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
