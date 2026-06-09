# CSRF — Web Core BFF (Web Auth 2)

Protection CSRF des routes Auth mutatives (`/api/auth/login|refresh|logout`). **Aucun lien avec les
tokens d'authentification.**

## Double-submit cookie

1. Le navigateur obtient un jeton via `GET /api/auth/csrf` → un **cookie CSRF** est posé et le **jeton**
   est renvoyé dans le corps.
2. Pour toute requête mutative, le JS lit la valeur du cookie CSRF et l'envoie dans l'en-tête
   **`X-CSRF-Token`**.
3. Le serveur compare **cookie vs en-tête** (présents, format strict, **même longueur**, égalité en
   **temps constant**). Mismatch → **403** générique.

Aucune persistance serveur : le serveur ne stocke pas le jeton (il compare seulement les deux soumissions).

## Pourquoi `HttpOnly: false` pour le cookie CSRF

Le double-submit exige que le **JS lise** le jeton pour le renvoyer en en-tête → le cookie CSRF est
**non HttpOnly** (le **seul** cookie volontairement lisible). Il ne contient **aucun secret
d'authentification** : juste une valeur aléatoire (256 bits, base64url). Les cookies Auth (`access`,
`refresh`) restent **HttpOnly** (inaccessibles au JS).

## Login CSRF

**Le login est aussi protégé** : un attaquant ne peut pas forcer une connexion (login-CSRF) car il ne peut
pas lire le cookie CSRF same-origin de la victime pour produire l'en-tête.

## Origin / Referer (défense complémentaire)

Avant le CSRF, chaque route mutative vérifie l'origine : `Origin` (sinon `Referer`) doit appartenir à
`WEB_ALLOWED_ORIGINS` — comparaison **exacte** `scheme+host+port`. **Fail-closed** si les deux sont absents.

## Rotation

- créé/renouvelé par `GET /api/auth/csrf` ;
- **renouvelé** après **login** réussi et **refresh** réussi (le cookie reçoit une nouvelle valeur — le JS
  doit relire le cookie) ;
- **supprimé** au **logout** ; l'ancien jeton est alors refusé (le cookie ne correspond plus).

## En-têtes

`GET /api/auth/csrf` : `Cache-Control: no-store`, `Pragma: no-cache`, `Referrer-Policy: no-referrer`.
Toutes les réponses Auth : `no-store`.

## Exemple (Fetch navigateur)

```ts
// 1) Bootstrap
const csrf = (await (await fetch("/api/auth/csrf")).json()).data.csrfToken;
// 2) Login (cookies envoyés automatiquement ; en-tête CSRF requis)
await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf },
  body: JSON.stringify({ email, password }),
});
// 3) Pour refresh/logout : relire le cookie CSRF (renouvelé) avant l'appel, ou re-`GET /api/auth/csrf`.
```

> Le serveur **ne renvoie jamais** d'access/refresh token au navigateur : seuls des cookies `HttpOnly`
> sont posés. Le cookie CSRF n'est **pas** un token d'authentification.
