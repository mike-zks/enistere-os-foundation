# UsersModule — V1 (fondations Auth, étape 1)

Module utilisateur interne **minimal et générique**, support des futures missions
d'authentification. Aucune logique métier projet.

## Périmètre actuel

Opérations internes uniquement (aucun endpoint public, aucun register public) :

- `UsersService.normalizeEmail(email)` : normalisation (trim + minuscule) ;
- `findByEmail(email)` → `PublicUser | null` ;
- `findById(id)` → `PublicUser | null` ;
- `findAuthUserByEmail(email)` → `AuthUser | null` (usage authentification, inclut le hash) ;
- `emailExists(email)` → `boolean` ;
- `createUser(input)` → `PublicUser` (à partir d'un `passwordHash` déjà produit).

## Contrats

- `PublicUser` : contrat applicatif/public, **sans `passwordHash`**.
- `AuthUser` : contrat réservé à l'authentification, **avec `passwordHash`** — ne jamais
  exposer via une API publique ni journaliser.
- `CreateUserInput` : entrée interne de création (DTO class-validator, ADR-003), distincte
  du modèle Prisma.

## Règles respectées

- aucune logique de hashing ici (le service reçoit un `passwordHash` déjà produit ;
  le hashing sera placé dans l'AuthModule) ;
- séparation accès Prisma (`UsersRepository`) / logique applicative (`UsersService`) ;
- les modèles Prisma ne sont pas exposés comme DTO publics (ADR-002) ;
- aucune notion de rôle ou permission (réservée à ADR-006) ;
- erreurs génériques : `USER_EMAIL_ALREADY_EXISTS` à la création ; codes `USER_NOT_FOUND`
  et `USER_INACTIVE` réservés aux usages futurs.

## Structure

```txt
src/users/
  users.module.ts
  users.service.ts
  users.repository.ts
  dto/
    create-user.input.ts
  models/
    user.model.ts
  users.service.spec.ts
  users.repository.spec.ts
```

## Limites

- pas de mise à jour ni de suppression d'utilisateur ;
- pas de rôles ni permissions ;
- pas d'endpoint HTTP.
