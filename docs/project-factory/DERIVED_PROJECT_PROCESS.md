# Derived Project Process

> Processus officiel pour transformer une idee projet en projet derive Enistere OS Foundation.
> Statut : **SPECIFICATION_DOCUMENTAIRE**.
> Date : 2026-07-18.

## 1. Objectif

Un projet derive est une application ou plateforme construite a partir d'une combinaison gouvernee de
cores Enistere OS Foundation.

La Foundation ne doit pas imposer une seule stack. Elle doit permettre de choisir une composition
coherente selon le contexte du projet :

- API NestJS ou Spring Boot ;
- Web Next.js ou Angular ;
- Mobile React Native ou Flutter ;
- Cloud Core V1 pour staging/deploiement ;
- Quality Core et Docs Core pour les gates, checklists et statuts ;
- AI Core pour cadrer les missions et produire des artefacts documentaires controles.

## 2. Principe

```txt
Idee -> cadrage fonctionnel -> blueprint technique -> profil stack -> bootstrap -> gates -> projet derive
```

Le choix de stack vient apres le cadrage du besoin. Il ne doit pas etre choisi uniquement par preference
technique.

## 3. Etapes obligatoires

### 3.1 Idea Intake

Capturer l'idee sans implementation :

- probleme a resoudre ;
- utilisateurs cibles ;
- contexte metier ;
- donnees manipulees ;
- contraintes legales, securite, confidentialite ;
- canaux cibles : API, web, mobile, admin, integration externe ;
- urgence V1 et hors-perimetre.

Sortie attendue : fiche courte d'idee.

### 3.2 Functional Brief

Formaliser le produit :

- roles utilisateurs ;
- parcours principaux ;
- entites metier ;
- permissions ;
- fichiers/uploads si necessaires ;
- notifications, analytics, audit, i18n si necessaires ;
- criteres d'acceptation V1 ;
- risques fonctionnels.

Sortie attendue : documentation fonctionnelle V1.

### 3.3 Technical Blueprint

Choisir la composition technique :

- API Core cible ;
- Web Core cible ou absence de web ;
- Mobile Core cible ou absence de mobile ;
- stockage, auth, RBAC, fichiers, audit ;
- choix de contrats API ;
- variables d'environnement ;
- strategie locale/staging ;
- gates qualite obligatoires ;
- ecarts a documenter par ADR projet derive.

Sortie attendue : blueprint technique V1.

### 3.4 Stack Profile Selection

Selectionner un profil depuis [`STACK_PROFILES_MATRIX.md`](./STACK_PROFILES_MATRIX.md).

La selection doit expliciter :

- pourquoi ce profil est retenu ;
- pourquoi les alternatives principales sont rejetees ;
- les limites connues ;
- les adaptations obligatoires ;
- les gates de validation.

### 3.5 Bootstrap

Initialiser le projet derive :

- repository ou dossier projet ;
- README projet ;
- `.env.example` ;
- documentation fonctionnelle et technique initiale ;
- ADR projet derive si ecart Foundation ;
- scripts qualite ;
- smoke minimal ;
- lien vers la version Foundation utilisee.

### 3.6 Validation

Un projet derive V1 ne doit pas etre declare pret sans :

- gates du profil selectionne ;
- smoke local ou staging adapte ;
- revue securite minimale ;
- verification que les secrets ne sont pas versionnes ;
- revue des ecarts a la Foundation.

## 4. Regles de composition

### 4.1 Ce qui peut etre combine

Les cores peuvent etre combines tant que le contrat entre eux est explicite :

- API -> Web via BFF ou HTTP client ;
- API -> Mobile via Bearer + refresh ;
- UI -> Web via package UI Kit ou Material Angular ;
- Cloud -> services via Compose V1/staging ;
- Quality -> gates locaux/CI ;
- Docs -> statuts, runbooks, changelog.

### 4.2 Ce qui ne doit pas etre improvise

Les sujets suivants exigent une decision documentee s'ils divergent de la Foundation :

- changement de mode auth/session ;
- stockage de secrets ;
- publication registry ;
- provider LLM reel ;
- SDK analytics/crash reel ;
- stockage natif mobile choisi ;
- deploiement production ;
- exposition publique d'un endpoint ou d'un bucket ;
- schema de donnees metier sensible.

## 5. Sorties documentaires minimales

Chaque projet derive doit produire au demarrage :

```txt
README.md
docs/
  FUNCTIONAL_BRIEF.md
  TECHNICAL_BLUEPRINT.md
  STACK_DECISION.md
  SECURITY_NOTES.md
  RELEASE_PLAN.md
.env.example
```

## 6. Position vis-a-vis de JHipster

Enistere Project Factory peut viser une ergonomie proche de JHipster, mais avec une difference de fond :

- JHipster genere une application complete tres opinionated ;
- Enistere genere un socle projet derive conforme aux cores, ADR, gates et runbooks de la Foundation ;
- les ecarts restent visibles, documentes et gouvernes ;
- le projet derive n'est pas une boite noire.

## 7. Limites de cette version

Cette mission ne livre pas encore :

- generateur CLI ;
- copie de fichiers ;
- templates parametrables ;
- exemple derive bout-en-bout ;
- publication npm registry ;
- adaptation automatique des contrats API entre Spring et TypeScript.

Ces points appartiennent aux missions Project Factory suivantes.

