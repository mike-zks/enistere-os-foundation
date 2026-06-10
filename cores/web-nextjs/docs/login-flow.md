# Parcours de connexion — Web Core (Web Auth 5)

> Page **publique** `/login` + formulaire accessible, **login via le BFF** (jamais l'API directe), navigation
> interne **sûre** après succès. **Sans middleware, sans Server Action Auth, sans token en JavaScript, sans
> credential en cache.** L'**API NestJS reste l'autorité finale**. Web Core reste `IMPLEMENTATION_PARTIELLE`.

## 1. Parcours

```
Anonyme → GET /protected
  → layout protégé : session anonyme → redirect('/login?returnTo=/protected')   (serveur)
Anonyme → GET /login
  → page (Server Component) : session anonyme → rend <LoginForm>
  → utilisateur soumet (Client) : GET /api/auth/csrf → POST /api/auth/login (BFF, cookies HttpOnly posés)
  → succès : purge authKeys → router.replace(returnTo) + router.refresh()
  → navigation /protected : layout résout la session (serveur) → authentifié → hydratation
Déjà authentifié → GET /login
  → page : session authenticated → redirect(returnTo assaini)   (jamais de formulaire)
```

## 2. Page `/login` (`src/app/login/page.tsx`, Server Component, `force-dynamic`)

1. lit `searchParams.returnTo` puis l'**assainit** (`sanitizeReturnTo` → chemin interne ou `/protected`) ;
2. **résout la session côté serveur** (lecture seule, `resolveNextServerSession`) ;
3. `authenticated` → **redirige** vers `returnTo` (aucun formulaire, aucun login inutile) ;
4. `anonymous` → rend `<LoginPanel>` (formulaire) ;
5. `unavailable` → rend **quand même** le formulaire avec un **état dégradé** (le BFF reste l'autorité à la
   soumission). Le build reste indépendant de l'API (route dynamique).

## 3. Formulaire (`features/auth/login-form.tsx`, présentationnel, testable)

- `<form>` sémantique : `<label>` + `<input type="email" autoComplete="email">` / `<input type="password"
  autoComplete="current-password">` + `<button type="submit">` ; `noValidate` (UX maîtrisée).
- **Validation UX** (`login-validation.ts`, pure) : e-mail (trim, forme, ≤ 254) et mot de passe (non vide,
  ≤ 200, **jamais modifié**). Elle **n'est pas** une sécurité — l'API valide et refuse en dernier ressort.
- **Accessibilité** : `aria-invalid` (champ), `aria-describedby` (message ↔ champ), `role="alert"` (erreurs),
  `aria-busy` + bouton désactivé pendant la soumission. Tests `jest-axe` sur 4 états.
- **Mot de passe** : vit uniquement dans l'état local du champ — **jamais** journalisé, mis en cache, mis en
  URL, ni rendu en texte. Navigation après succès → démontage du formulaire.

## 4. Login BFF (`core/auth/client/login-client.ts`)

`performBffLogin(email, password)` : `getCsrfToken()` (`GET /api/auth/csrf`) → `POST /api/auth/login`
**same-origin**, `credentials:"include"`, en-tête `X-CSRF-Token`, corps `{ email, password }`. **Aucun token
Auth** n'est lu (les cookies `HttpOnly` sont posés par le BFF). Erreurs **génériques** (`BffAuthError`).

## 5. Mutation & navigation (`features/auth/use-login.ts`, `app/login/login-panel.tsx`)

- `useLogin({ onAuthenticated })` (`useMutation`, **sans `mutationKey`** → aucun credential en clé) : sur
  **succès**, `removeQueries(authKeys.all)` (purge un éventuel `anonymous` résiduel ; **Health conservé**)
  puis `onAuthenticated()`. **Anti-double-soumission** par verrou synchrone (`useRef`) **et** bouton désactivé.
- `LoginPanel` (Client, wiring Next, exclu de `node:test`) fournit `onAuthenticated = () =>
  { router.replace(returnTo); router.refresh(); }` : **`replace`** (pas `push` → « Retour » ne ramène pas au
  formulaire) puis `refresh` (revalide la résolution serveur ; le profil réel vient de `/auth/me`, **pas** de
  la réponse login).

## 6. Erreurs UX (`features/auth/login-error.ts`)

`toLoginError` → message **public générique** : `401` = « Adresse e-mail ou mot de passe incorrect. »
(**aucune énumération** d'e-mail), `429` = « Trop de tentatives… », `403` = « Requête refusée… », réseau /
`5xx` = service indisponible. Jamais de stack/cause/réponse brute/token. `requestId` affiché **séparément**
comme simple référence.

## 7. `returnTo` & open redirect

Voir [`protected-routes.md`](protected-routes.md) §4b : `sanitizeReturnTo` n'accepte qu'un **chemin interne**
(sinon `/protected`), refuse schémas/hôtes externes/`//`/`\`/`..`/contrôle/encodages trompeurs et routes
Auth/API (anti-boucle). La destination **ne provient jamais** d'un `Referer` non fiable.

## 8. Hors périmètre

Pas de middleware/proxy, inscription, forgot/reset password, OTP, OAuth, MFA, magic link, captcha, remember-me,
gestion de profil, navigation Auth globale, Server Action Auth, login direct vers l'API. Prochaine étape :
**revue globale Auth Web 1 → 5**.

## 9. Preuve avec API réelle

Scénario rejoué de bout en bout (PostgreSQL jetable, utilisateur de preuve éphémère, environnement démonté).
Résumé (assertions clés) : anonyme `GET /protected` → **redirection serveur vers `/login?returnTo=/protected`**
(sans donnée privée) · `GET /login` → **200 + formulaire** (aucun token) · CSRF + `login` BFF →
`authenticated:true` (**aucun token**, cookie `HttpOnly` posé) · authentifié `GET /protected` → **200 + profil
hydraté** (`X-Request-Id` propagé) · **authentifié `GET /login` → redirection hors login** vers `returnTo` ·
**`returnTo` externe (`https://evil…`) jamais suivi** (assaini → `/protected`) · logout → `/protected` redirige
vers `/login` · identifiants invalides → **401 générique** (aucune énumération/token) · CSRF invalide → **403** ·
bundle/HTML **sans** `API_INTERNAL_URL`, sans cookie Auth, sans mot de passe.
