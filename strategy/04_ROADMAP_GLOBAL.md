# Roadmap globale V2

| Étape | Livrable | Preuve de sortie |
|---|---|---|
| R1 | Taxonomie Factory | aucun répertoire opérationnel `cores/` |
| R2 | Blueprint + CLI | validation et lock déterministes |
| R3 | Contrat des six starters | install/dev/test/build/verify cohérents |
| R4 | Capability packs réels | sélection modifie réellement les projets |
| R5 | Agents locaux | worktree et deux approbations humaines |
| R6 | Deployment packs | local/staging générés sans secret |
| R7 | Matrice de profils | combinaisons supportées explicitement |
| R8 | Golden runtimes | deux verticales web et une mobile démarrent |
| R9 | Compilateur de domaine | CRUD généré et testé sur NestJS et Spring |
| R10 | Cycle de vie | upgrade, migrations blueprint et SemVer |
| R11 | Distribution | CLI et packages installables depuis registry |
| R12 | Adoption | métriques et feedback de projets réels |

## Séquence active

1. Consolider la taxonomie et les documents V2.
2. Livrer `base/auth/rbac/files` en overlays sur NestJS + Next.js + React Native.
3. Atteindre la parité Spring + Angular + Flutter.
4. Exécuter les golden runtimes R8.
5. Ouvrir R9 uniquement après preuve de composition sur les deux verticales.

Toute nouvelle capability transversale doit être demandée par un blueprint, un golden ou un projet
dérivé réel. L'expansion documentaire sans consommateur est interdite.
