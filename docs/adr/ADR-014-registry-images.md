# ADR-014 — Registry images

## 1. Titre

Stratégie registry d'images Docker pour Enistere OS Foundation.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

Enistere OS Foundation doit définir une stratégie standard pour publier, versionner, sécuriser et tracer les images Docker des futurs starters et projets dérivés.

Cette ADR impacte :

- Cloud Core ;
- API Core NestJS ;
- Web Core Next.js ;
- futurs workers et jobs ;
- ADR-013 CI/CD V1 ;
- publication d'images ;
- tagging ;
- sécurité des images ;
- secrets registry ;
- déploiement ;
- projets dérivés.

Cette ADR ne crée aucun code, Dockerfile, Docker Compose, workflow GitHub Actions, script, package, dépendance, image Docker ou push registry.

## 5. Problème

Sans décision registry, les futurs projets peuvent diverger sur :

- lieu de publication des images ;
- permissions registry ;
- stratégie de tags ;
- usage de `latest` ;
- traçabilité entre commit, tag Git, image et release ;
- rétention des images ;
- sécurité des secrets ;
- séparation fondation / projets dérivés ;
- compatibilité avec CI/CD et Cloud Core.

Une registry mal cadrée peut provoquer des images non traçables, des secrets exposés, des tokens trop permissifs ou un déploiement d'image non validée.

## 6. Options étudiées

### Option A — GitHub Container Registry

Utiliser GHCR comme registry standard V1, intégré à GitHub, GitHub Actions et aux releases.

Avantages :

- cohérence avec GitHub ;
- intégration naturelle avec GitHub Actions ADR-013 ;
- gestion intégrée des permissions ;
- traçabilité repo, image et release ;
- simplicité V1 ;
- compatible Docker standard ;
- réduit l'infrastructure à maintenir ;
- adapté aux projets dérivés hébergés sur GitHub.

Inconvénients :

- dépendance à GitHub ;
- coûts ou limites à surveiller selon usage ;
- gouvernance packages GitHub à documenter ;
- plan de sortie à garder possible.

### Option B — Registry privée auto-hébergée

Déployer une registry privée dans le Cloud Core.

Avantages :

- contrôle infrastructure fort ;
- souveraineté accrue ;
- personnalisation possible ;
- utile pour organisations très contraintes.

Inconvénients :

- infrastructure supplémentaire ;
- sécurité, backup et haute disponibilité à gérer ;
- complexité prématurée en V1 ;
- coût d'exploitation plus élevé ;
- moins aligné avec la simplicité CI/CD V1.

### Option C — Docker Hub

Utiliser Docker Hub comme registry principale.

Avantages :

- très connu ;
- compatible Docker ;
- simple pour images publiques ;
- écosystème large.

Inconvénients :

- moins intégré à GitHub que GHCR ;
- gouvernance des images privées à cadrer ;
- quotas et coûts potentiels ;
- traçabilité repo/release moins directe ;
- risque d'usage public par défaut mal maîtrisé.

### Option D — Registry cloud provider

Utiliser AWS ECR, GitLab Container Registry, Scaleway Registry, Harbor managé ou équivalent.

Avantages :

- bonne intégration avec un provider cloud donné ;
- sécurité et IAM avancés possibles ;
- performance régionale possible ;
- adapté à certains contextes production.

Inconvénients :

- dépendance provider ;
- moins générique pour la fondation ;
- configuration CI/CD plus spécifique ;
- complexité V1 plus élevée ;
- divergences entre projets dérivés.

### Option E — Pas de registry en V1

Construire les images localement ou directement sur serveur sans publication registry.

Avantages :

- aucune registry à configurer ;
- simplicité apparente au début ;
- adapté à une phase documentaire pure.

Inconvénients :

- non reproductible ;
- déploiements moins traçables ;
- rollback plus difficile ;
- images non versionnées ;
- incompatible avec CI/CD et Cloud Core dès que les starters existent.

## 7. Décision

Enistere OS Foundation retient **l'Option A — GitHub Container Registry**.

La décision officielle est :

```txt
Enistere OS Foundation adopte GitHub Container Registry comme registry standard V1 pour les images Docker.
```

Précisions :

```txt
- GitHub Container Registry est le standard V1.
- Les images sont publiées depuis GitHub Actions quand les workflows seront créés.
- Les tags doivent être explicites, versionnés et traçables.
- Les secrets registry ne doivent jamais être stockés dans Git.
- Les projets dérivés peuvent utiliser une autre registry uniquement si documenté.
```

GHCR est le standard V1 pour la fondation et les projets dérivés GitHub. Une registry privée ou cloud provider pourra être envisagée plus tard si les besoins de souveraineté, coût, performance ou organisation l'exigent.

## 8. Raisons de la décision

GHCR est retenu car il permet :

- cohérence avec GitHub ;
- cohérence avec GitHub Actions ADR-013 ;
- simplicité V1 ;
- gestion intégrée des permissions ;
- traçabilité repo / image / release ;
- réduction de l'infrastructure auto-hébergée ;
- compatibilité Docker standard ;
- meilleure expérience pour Codex / Claude Code ;
- séparation claire entre fondation et projets dérivés ;
- évolution possible vers registry privée plus tard.

## 9. Comparaison des options

| Critère | Option A GHCR | Option B registry privée | Option C Docker Hub | Option D provider cloud | Option E pas de registry |
|---|---|---|---|---|---|
| Simplicité V1 | Forte | Faible | Moyenne | Moyenne | Forte mais limitée |
| Intégration GitHub Actions | Forte | Moyenne | Moyenne | Variable | Faible |
| Traçabilité repo/image | Forte | Moyenne | Moyenne | Variable | Faible |
| Sécurité permissions | Bonne | À gérer | Variable | Bonne | Faible |
| Coût opérationnel | Faible | Élevé | Variable | Variable | Faible |
| Portabilité Docker | Forte | Forte | Forte | Forte | Faible |
| Souveraineté | Moyenne | Forte | Moyenne | Variable | Variable |
| Adaptation projets dérivés | Forte si GitHub | Moyenne | Moyenne | Moyenne | Faible |

## 10. Stratégie registry V1

GHCR est la registry standard V1.

Principes :

- publication via GitHub Actions quand les workflows existeront ;
- images associées au repository ou au projet dérivé ;
- permissions contrôlées par GitHub Packages ;
- images privées par défaut si le projet le nécessite ;
- images publiques uniquement si le besoin est explicite ;
- tags traçables ;
- rétention documentée ;
- secrets hors Git.

La fondation ne pousse aucune image tant qu'aucun starter exécutable et workflow validé n'existe.

## 11. Stratégie tagging

Les tags doivent être explicites, versionnés et traçables.

Tags conceptuels à prévoir :

```txt
latest
develop
staging
production
vX.Y.Z
sha-<shortsha>
pr-<number>
```

Règles :

- `latest` ne doit pas être utilisé comme référence unique en production ;
- les tags SemVer doivent être privilégiés pour les releases ;
- les tags SHA assurent la traçabilité ;
- les tags d'environnement doivent être contrôlés ;
- les images de PR ne doivent pas être conservées indéfiniment ;
- une image de production doit pouvoir être reliée à un commit, un tag Git et un changelog.

## 12. Stratégie publication d'images

La publication d'images doit passer par la CI/CD quand les workflows existeront.

Principes :

- build uniquement après checks adaptés ;
- publication conditionnée au contexte : PR, branche, tag ou release ;
- push registry selon permissions minimales ;
- pas de publication depuis poste local comme flux standard ;
- pas de publication d'image non validée ;
- logs de publication sans secrets ;
- tags cohérents avec ADR-013.

Les images ne doivent pas devenir un substitut à la validation CI.

## 13. Stratégie sécurité registry

Exigences :

- secrets hors Git ;
- tokens à permissions minimales ;
- permissions GitHub Packages contrôlées ;
- images privées par défaut si nécessaire ;
- scan vulnérabilités si disponible ;
- pas de secrets dans images ;
- pas de `.env` dans images ;
- pas de credentials build dans layers ;
- tags immuables si possible pour releases ;
- suppression ou rétention contrôlée des anciennes images ;
- audit des publications ;
- provenance image si possible plus tard.

Les images doivent être considérées comme des artefacts sensibles si elles contiennent du code propriétaire.

## 14. Stratégie rétention

La rétention doit éviter l'accumulation incontrôlée d'images.

Principes :

- conserver les images de release ;
- conserver les images de production tant qu'elles peuvent servir au rollback ;
- limiter les images de PR ;
- nettoyer les tags temporaires ;
- documenter la durée de conservation par projet ;
- éviter de supprimer une image encore déployée ;
- surveiller coûts et stockage.

La suppression d'images doit rester compatible avec les besoins de rollback.

## 15. Stratégie environnements

Les tags d'environnement doivent être contrôlés.

Principes :

- `develop` pour intégration ou développement contrôlé ;
- `staging` pour validation pré-production ;
- `production` uniquement après validation ;
- `vX.Y.Z` pour release stable ;
- `sha-<shortsha>` pour traçabilité ;
- séparation claire entre environnements ;
- pas de confusion entre tag environnement et version release.

La production doit pointer vers une image vérifiée, traçable et documentée.

## 16. Stratégie projets dérivés

Chaque projet dérivé peut publier ses propres images dans son scope.

Règles :

- documentation dans `foundation.md` ou documentation projet ;
- respect des conventions de tagging ;
- respect des règles de secrets ;
- publication par CI/CD quand disponible ;
- liens entre image, commit, tag Git et changelog ;
- dérogation à GHCR uniquement avec justification documentée.

La fondation fournit le standard ; les projets dérivés l'adaptent sans affaiblir les exigences de sécurité.

## 17. Conséquences positives

- Registry V1 claire et cohérente avec GitHub.
- Intégration naturelle avec ADR-013.
- Traçabilité image / repository / release.
- Moins d'infrastructure auto-hébergée.
- Tags explicites et auditables.
- Meilleure base pour rollback futur.
- Règles communes pour les projets dérivés.

## 18. Conséquences négatives

- Dépendance initiale à GHCR.
- Besoin de gouvernance GitHub Packages.
- Rétention et coûts à surveiller.
- Registry alternative à documenter pour certains projets.
- Nécessité de maintenir des conventions de tags strictes.

## 19. Risques

- Utiliser `latest` en production.
- Images non traçables.
- Secrets inclus dans images.
- Tokens registry trop permissifs.
- Absence de scan.
- Rétention non contrôlée.
- Coûts ou stockage non maîtrisés.
- Divergence entre registry fondation et projets dérivés.
- Déploiement d'une image non validée par CI.
- Confusion entre tags staging/production et versions SemVer.

## 20. Alternatives rejetées

La registry privée auto-hébergée est rejetée comme standard V1 car elle ajoute trop d'infrastructure et de maintenance avant les premiers starters.

Docker Hub est rejeté comme standard principal car il est moins intégré à GitHub, aux releases et à la gouvernance actuelle.

Une registry cloud provider est rejetée comme standard V1 car elle introduit une dépendance provider trop spécifique.

L'absence de registry est rejetée car elle empêcherait la traçabilité, la reproductibilité et le rollback des images.

## 21. Impact sur Cloud Core

Le Cloud Core doit consommer des images traçables.

À prévoir plus tard :

- pull depuis GHCR ;
- authentification registry contrôlée ;
- tags explicites ;
- rollback vers image précédente ;
- scan ou validation image si disponible ;
- absence d'image `latest` comme référence unique en production ;
- documentation des images déployées.

Aucun déploiement cloud réel n'est créé par cette ADR.

## 22. Impact sur API Core NestJS

Le futur starter API pourra produire une image Docker quand le périmètre technique sera créé.

Règles attendues :

- image taguée par version et commit ;
- build validé par CI ;
- pas de secrets dans l'image ;
- pas de `.env` embarqué ;
- scan si disponible ;
- publication GHCR via workflow validé.

Cette ADR ne crée aucun Dockerfile API.

## 23. Impact sur Web Core Next.js

Le futur starter Web pourra produire une image Docker si la stratégie de déploiement le retient.

Règles attendues :

- aucun secret serveur dans le bundle client ;
- variables publiques maîtrisées ;
- image liée au commit et au tag release ;
- publication GHCR contrôlée ;
- tags staging / production utilisés avec prudence.

Cette ADR ne crée aucun Dockerfile Web.

## 24. Impact sur ADR-013 CI/CD

ADR-013 définit GitHub Actions comme CI/CD V1.

ADR-014 précise que :

- GHCR est la registry standard V1 ;
- les images seront publiées depuis GitHub Actions quand les workflows existeront ;
- tout push registry doit respecter les checks CI ;
- les tokens doivent avoir des permissions minimales ;
- les releases doivent relier tag Git, changelog et image.

## 25. Impact sur Git / ADR-001

ADR-001 définit un monorepo de fondation et des repositories séparés pour les projets dérivés.

ADR-014 applique cette séparation :

- images de fondation dans le scope de la fondation si nécessaire ;
- images de projets dérivés dans leurs propres scopes ;
- secrets registry isolés par repository ou organisation ;
- cycles de release indépendants ;
- conventions communes de tagging.

## 26. Impact sur projets dérivés

Les projets dérivés doivent :

- documenter leurs images ;
- documenter leur registry ;
- respecter les tags standard ;
- conserver les secrets hors Git ;
- éviter `latest` comme référence unique en production ;
- publier via CI/CD quand disponible ;
- justifier toute registry alternative ;
- maintenir changelog et tags Git.

## 27. Impact sur IA / Codex / Claude Code

Les agents IA doivent :

- ne pas créer de Dockerfile ou workflow sans mission explicite ;
- ne pas pousser d'image ;
- ne pas manipuler de token registry réel ;
- ne pas insérer de secret dans une image ;
- proposer des tags traçables ;
- rappeler que `latest` ne suffit pas en production ;
- signaler les risques de registry et rétention.

L'IA assiste la génération et la revue, mais ne décide pas seule une publication d'image ou une release.

## 28. Règles d'application

- GHCR est la registry standard V1.
- Les images doivent être construites par CI quand les workflows existeront.
- Les tags doivent inclure une trace de version ou commit.
- Production ne doit pas dépendre uniquement de `latest`.
- Les secrets ne doivent jamais entrer dans les images.
- Les permissions registry doivent suivre le principe du moindre privilège.
- Les images de release doivent être liées au changelog et à un tag Git.
- Les projets dérivés doivent documenter leurs conventions d'images.
- Une registry alternative nécessite justification documentée.
- Les règles CI/CD d'ADR-013 s'appliquent à toute publication d'image.

## 29. Conditions de révision future

Cette ADR devra être révisée si :

- GHCR ne répond plus aux besoins ;
- les coûts ou limites GitHub Packages deviennent problématiques ;
- une contrainte de souveraineté impose une registry privée ;
- un cloud provider devient structurant ;
- Harbor ou une registry managée devient nécessaire ;
- les besoins de signature, provenance ou SBOM deviennent obligatoires ;
- l'orchestration future impose une autre convention de tagging.

## 30. Conclusion

Enistere OS Foundation adopte GitHub Container Registry comme registry standard V1 pour les images Docker.

Cette décision aligne registry, GitHub Actions, releases et traçabilité, tout en évitant une infrastructure auto-hébergée prématurée. Les projets dérivés peuvent déroger à GHCR uniquement avec justification documentée et sans affaiblir les règles de sécurité, tagging et traçabilité.
