# Cloud Core — Plan E2E navigateur Web (niveau 3, futur)

> **Plan, non implémenté.** Décrit le futur niveau E2E navigateur du Web Core. **Aucun outil E2E (Playwright
> ou autre) n'est ajouté dans cette mission.** Aligné sur `CLOUD_CORE_V1_EXECUTION_BASELINE.md` §13, la revue
> `cores/web-nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md` (réserve « E2E navigateur ») et ADR-013.

## 1. Objectif

Pérenniser en CI les **parcours navigateur** aujourd'hui rejoués manuellement (preuves runtime) : Health,
Auth (login/refresh/logout, protection des routes) et Files (métadonnées + téléchargement), contre une stack
réelle **éphémère**, **sans secret**.

## 2. Stack envisagée (indicative, non créée)

- **API NestJS** + **PostgreSQL** + **MinIO** (services éphémères, cf. `API_RUNTIME_CI_PLAN.md`).
- **Web Next.js** démarré (`next start`) avec `API_INTERNAL_URL`/`NEXT_PUBLIC_API_URL`/`WEB_ALLOWED_ORIGINS`
  de **test** (valeurs jetables, non sensibles).
- Outil E2E **à décider** : Playwright (candidat principal) ou alternative — **décision différée** (ADR léger
  possible si structurant).

## 3. Parcours cibles (indicatifs)

```text
Health        : page d'accueil, API disponible / indisponible (état contrôlé)
Auth          : anonyme /protected → /login ; login ; /protected hydraté ;
                refresh ; logout → /login ; returnTo interne (anti open-redirect)
Files         : /protected/files/[id] métadonnées ; téléchargement (URL signée) ;
                404 anti-énumération ; 403 sans permission ; 503 stockage indisponible
```

## 4. Contraintes

- **Données éphémères** : utilisateurs + fichiers créés puis détruits ; aucun seed permanent.
- **Captures uniquement en cas d'échec** (artefacts non sensibles ; jamais de cookie/token/URL signée dans
  les traces).
- **Aucun secret** : valeurs de test factices ; aucun `secrets.*`.
- **Stabilité** : éviter la flakiness (attentes explicites sur les états UI, pas de `sleep` arbitraire).
- **Temps CI** : déclenchement ciblé (push `main` / PR touchant le Web) si trop long pour chaque PR.

## 5. Prérequis avant implémentation

- CI runtime API (niveau 2) opérationnelle (la stack API+PG+MinIO doit déjà se monter en CI).
- Choix de l'outil E2E + intégration `node:test`/Playwright tranchée.
- Sélecteurs accessibles stables (rôles ARIA déjà présents : `role=alert/status`, labels).
- Politique d'artefacts (rétention courte, non sensibles).

## 6. Hors périmètre (cette mission)

Aucun outil E2E installé, aucun workflow E2E, aucune dépendance ajoutée. Ce plan sera implémenté au **niveau
3**, après la CI runtime API (niveau 2).
