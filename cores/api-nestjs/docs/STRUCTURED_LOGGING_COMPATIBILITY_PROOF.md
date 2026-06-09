# STRUCTURED_LOGGING_COMPATIBILITY_PROOF.md — Preuve `nestjs-pino` (Phase A)

> Application du mécanisme de décision d'**ADR-040** : `nestjs-pino` est l'intégration préférée
> **uniquement si** une preuve confirme sa compatibilité et son adéquation avec NestJS 11 et le
> starter ; sinon **Pino direct** (repli officiel). Ce document consigne la preuve et le verdict.

## Versions testées

| Paquet | Version | Notes |
|---|---|---|
| Node | v24.14.0 | runtime cible |
| `@nestjs/common` | 11.1.25 | NestJS 11 |
| `pino` | 9.14.0 | moteur |
| `pino-http` | 10.5.0 | (candidat, retiré) |
| `nestjs-pino` | 4.6.1 | (candidat, retiré) |
| `pino-pretty` | 13.1.3 | dev uniquement |

`nestjs-pino@4.6.1` déclare `peerDependencies` `@nestjs/common: ^8 || ^9 || ^10 || ^11` →
**compatible NestJS 11**. `npm audit` : **0 vulnérabilité** avec les trois paquets installés.

## Méthode

Installation des candidats puis **micro-prototype HTTP réversible** (script jetable, supprimé
après mesure) : module Nest minimal avec `LoggerModule.forRoot({ pinoHttp: { stream } })`, un
contrôleur `GET /probe/:id`, boot via `NestFactory.create` + `useLogger`, une requête
`GET /probe/abc-123?secret=topsecret`, capture du flux de logs, puis `app.close()`.

## Résultats empiriques (micro-prototype)

```json
{
  "booted": true,
  "logLines": 7,
  "autoHttpLog": true,
  "loggedUrlRaw": "/probe/abc-123?secret=topsecret",
  "pinoOwnReqId": 1,
  "destinationConfigurable": true
}
```

## Checklist (ADR-040 §29 — 17 points)

| # | Point | Résultat | Commentaire |
|---|---|---|---|
| 1 | Démarrage NestJS 11 | ✅ | boot OK, peer-deps ^11 |
| 2 | Logs de bootstrap | ✅ | `useLogger(app.get(Logger))` capté |
| 3 | Global prefix | ✅ (n/a) | starter sans préfixe global |
| 4 | Middleware request ID existant | ⚠️ | non lu par défaut ; nécessite `genReqId` |
| 5 | Une seule valeur de request ID | ❌ par défaut | pino-http génère **son propre** id (`1`) ≠ `X-Request-Id` |
| 6 | Passport JWT | ✅ (compatible) | non spécifique au logger |
| 7 | Guards globaux | ✅ (compatible) | — |
| 8 | Multer / upload | ⚠️ | risque de log de `req`/body sans serializers stricts |
| 9 | Filtre global d'exceptions | ⚠️ | risque de **double log** (auto + filtre) à neutraliser |
| 10 | Interceptor de réponses | ✅ | indépendant |
| 11 | HealthModule | ⚠️ | auto-log de `/health/*` à réduire via `customLogLevel`/`autoLogging` |
| 12 | Swagger (dev) | ✅ | — |
| 13 | `createApplicationContext` (CLI) | ⚠️ | **destination globale stdout** → corromprait le **JSON machine** des CLI |
| 14 | Jest / e2e | ✅ (compatible) | — |
| 15 | Arrêt propre | ✅ | `app.close()` OK |
| 16 | Absence de double log HTTP | ⚠️ | auto-log unique mais non maîtrisé (URL brute) |
| 17 | Aucun secret dans les logs | ❌ par défaut | **URL brute + query loggées** (`?secret=topsecret`), pas de route normalisée |

## Difficultés / frictions structurelles constatées

1. **Route non normalisée + fuite de query** : pino-http logge `req.url` **brut**
   (`/probe/abc-123?secret=topsecret`). Le starter exige une **route normalisée** (`/files/:id`) et
   **aucune query** dans les logs → il faut **désactiver l'auto-logging** et fournir un log HTTP
   custom (lecture de `req.route.path`).
2. **Double système de request ID** : pino-http génère un id propre (`1`), ignorant le middleware
   `X-Request-Id` déjà en place → il faut surcharger `genReqId` et **garantir l'unicité**.
3. **Intégrité stdout des CLI** : Pino/`nestjs-pino` écrivent par défaut sur **stdout (fd 1)**. Les
   commandes (`files:reconcile`, etc.) émettent leur **résultat machine JSON sur stdout** ; un log
   technique sur stdout **corromprait** ce JSON. La destination de `nestjs-pino` est **globale**
   (forRoot) et partagée par le contexte HTTP **et** `createApplicationContext` → router les logs
   CLI vers **stderr** tout en gardant les logs HTTP sur stdout impose une logique conditionnelle.

Aucune de ces frictions n'est un bug de `nestjs-pino` ; mais **les lever revient à désactiver son
auto-logging et à réécrire le log HTTP, le request id et la destination** — c'est-à-dire à
reconstruire l'essentiel en custom, tout en conservant une dépendance opinionnée supplémentaire.

## Verdict

`nestjs-pino` est **compatible** avec NestJS 11 (boot, peer-deps, 0 vuln) mais **structurellement
peu adapté** aux exigences du starter (route normalisée, aucune query/secret loggé, réutilisation
stricte de `X-Request-Id`, intégrité stdout des CLI). Conformément au mécanisme d'**ADR-040 §7/§30**,
on retient la **stratégie de repli officielle : Pino direct**.

## Solution retenue

**Pino direct** (`pino`) avec :

- un `AppLogger` injectable implémentant `LoggerService` (NestJS) + méthodes structurées ;
- un **middleware de contexte** (`AsyncLocalStorage`) réutilisant `X-Request-Id` (un seul id) ;
- un **log HTTP unique** émis sur `res 'finish'` (route **normalisée** via `req.route.path`, niveau
  selon statut, santé réduite, **aucun body/query**) ;
- une **redaction centralisée** (`pino.redact` + serializers d'erreur) ;
- une **destination par point d'entrée** : **stdout** pour l'app HTTP, **stderr** pour les CLI
  (flag interne `LOG_STDERR`), préservant le JSON machine des commandes.

## Justification du rejet de `nestjs-pino`

Rejet **non** motivé par une incompatibilité de version (il est compatible), mais par un **mauvais
rapport valeur/coût** ici : ses comportements par défaut (auto-log d'URL brute, req id propre,
destination globale) doivent tous être neutralisés/réécrits pour satisfaire les exigences de
sécurité et d'exploitation, ce qui annule son bénéfice d'intégration tout en ajoutant une dépendance.

## Dépendances

- **Conservées** : `pino` (runtime), `pino-pretty` (dev, pretty-print local uniquement).
- **Retirées après la preuve** : `nestjs-pino`, `pino-http`.
- `npm audit` après nettoyage : **0 vulnérabilité** ; `npm run build` : RC=0.
