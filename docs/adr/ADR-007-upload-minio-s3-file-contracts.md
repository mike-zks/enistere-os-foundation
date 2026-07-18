# ADR-007 — Upload MinIO/S3 et contrats fichiers

## 1. Titre

Stratégie d'upload, de stockage objet MinIO/S3 et de contrats fichiers.

## 2. Statut

Validé.

## 3. Date

2026-05-30.

## 4. Contexte

Enistere OS Foundation doit fournir une stratégie générique pour gérer les fichiers dans les futurs projets web, mobiles, API et plateformes SaaS.

Cette ADR concerne :

- API Core NestJS ;
- Deployment ;
- Mobile Core React Native ;
- Web Core Next.js ;
- UI Kit ;
- ADR-004 Auth/session ;
- ADR-006 RBAC et permissions fines ;
- ADR-011 Client HTTP ;
- stockage objet ;
- contrats fichiers ;
- validation, sécurité, lifecycle et audit.

Cette ADR ne crée aucun service upload réel, schéma Prisma, bucket MinIO, Docker Compose, client upload, composant UI, package ou dépendance.

## 5. Problème

Les fichiers sont une surface de risque importante.

Sans décision commune, les projets peuvent diverger sur :

- stockage local ou objet ;
- exposition publique des fichiers ;
- validation MIME, extension et taille ;
- URLs signées ;
- permissions d'accès ;
- metadata ;
- lifecycle et suppression ;
- upload Web / Mobile ;
- logs et audit ;
- sauvegardes et restore.

Une stratégie incomplète peut provoquer des fichiers publics par erreur, des uploads non validés, des URLs trop longues, des abus par upload massif ou une dépendance forte à un provider propriétaire.

## 6. Options étudiées

### Option A — Stockage local serveur

Stocker les fichiers directement sur le disque du serveur applicatif.

Avantages :

- simple à comprendre ;
- rapide pour un prototype local ;
- peu de services à configurer au départ.

Inconvénients :

- peu portable entre serveurs ;
- difficile à scaler ;
- couplage fort avec l'API ;
- backups et restore plus fragiles ;
- risque de perte de fichiers lors de redéploiements ;
- exposition statique souvent mal sécurisée.

### Option B — MinIO/S3 compatible avec API comme autorité

Utiliser un stockage objet compatible S3, avec l'API Core comme point de contrôle principal.

Avantages :

- portabilité local, serveur dédié et cloud ;
- compatibilité S3 ;
- buckets privés par défaut ;
- contrôle sécurité côté API ;
- permissions cohérentes avec ADR-006 ;
- URLs signées possibles ;
- coûts mieux contrôlés ;
- migration possible vers AWS S3 ou autre provider compatible ;
- intégration claire avec Deployment.

Inconvénients :

- service d'infrastructure supplémentaire ;
- policies et credentials à gérer proprement ;
- contrats fichiers à documenter ;
- sauvegardes objet à prévoir ;
- discipline nécessaire sur URLs signées et permissions.

### Option C — Upload direct client vers stockage sans contrôle API

Les clients Web/Mobile envoient directement les fichiers vers le stockage objet.

Avantages :

- performant pour gros fichiers ;
- réduit la charge API ;
- utile pour certains cas avancés.

Inconvénients :

- contrôle API affaibli si mal cadré ;
- validation et metadata plus complexes ;
- permissions plus difficiles à auditer ;
- risque d'objets orphelins ;
- nécessite URLs signées strictes ;
- non adapté comme standard V1.

### Option D — Provider cloud propriétaire obligatoire

Utiliser directement un provider spécifique comme AWS S3, Cloudinary ou équivalent comme standard obligatoire.

Avantages :

- services managés riches ;
- fonctionnalités avancées possibles ;
- scalabilité forte.

Inconvénients :

- dépendance provider ;
- coûts potentiellement moins maîtrisés ;
- moins adapté aux environnements auto-hébergés ;
- complexifie les projets simples ;
- réduit la portabilité de la fondation.

## 7. Décision

Enistere OS Foundation retient **l'Option B — MinIO/S3 compatible avec API comme autorité**.

La décision officielle est :

```txt
Enistere OS Foundation adopte MinIO/S3 compatible comme standard de stockage objet pour les fichiers.

L'API Core NestJS reste l'autorité d'upload, de validation, de metadata, de permissions et de génération éventuelle d'URLs signées.

Les clients Web et Mobile ne doivent pas contourner l'API pour accéder au stockage objet, sauf usage contrôlé d'URLs signées.
```

Précision V1 :

```txt
MinIO/S3 compatible est le standard V1.
L'API contrôle la validation, les permissions, les metadata et les URLs signées.
Les projets dérivés peuvent utiliser AWS S3 ou autre S3 compatible si le contrat reste identique.
```

## 8. Raisons de la décision

Cette décision permet :

- portabilité entre local, serveur dédié et cloud ;
- compatibilité avec MinIO et providers S3 compatibles ;
- contrôle sécurité centralisé côté API ;
- buckets privés par défaut ;
- upload compatible Web/Mobile ;
- gestion cohérente des metadata ;
- intégration avec RBAC et permissions fines ;
- auditabilité des actions sensibles ;
- indépendance vis-à-vis d'un provider propriétaire ;
- meilleure maintenabilité pour les projets dérivés.

Elle garde l'API Core comme autorité fonctionnelle et le Deployment comme fournisseur d'infrastructure.

## 9. Comparaison des options

| Critère | Option A stockage local | Option B MinIO/S3 + API | Option C direct client | Option D provider obligatoire |
|---|---|---|---|---|
| Portabilité | Faible | Forte | Moyenne | Variable |
| Sécurité | Fragile si mal exposé | Forte si API contrôle | Risquée sans cadrage strict | Forte mais dépend provider |
| Scalabilité | Faible à moyenne | Bonne | Bonne | Forte |
| Coûts | Simples au départ | Maîtrisables | Maîtrisables mais plus complexe | Variables |
| Compatibilité Deployment | Faible | Forte | Moyenne | Moyenne |
| Compatibilité Web/Mobile | Moyenne | Forte | Forte mais plus risquée | Forte |
| Auditabilité | Moyenne | Forte | Moyenne | Variable |
| Simplicité V1 | Simple mais limitée | Équilibrée | Trop avancée | Trop structurante |
| Indépendance provider | Forte | Forte | Forte si S3 compatible | Faible |

## 10. Contrat conceptuel fichier

Le contrat fichier doit être défini conceptuellement avant tout schéma réel.

Champs minimaux à prévoir :

- `id` ;
- `ownerId` ou `subjectId` si applicable ;
- `originalName` ;
- `storageKey` ;
- `bucket` ;
- `mimeType` ;
- `extension` ;
- `size` ;
- `checksum` éventuel ;
- `visibility` ;
- `status` ;
- `category` ;
- `metadata` ;
- `createdAt` ;
- `updatedAt` ;
- `deletedAt` éventuel.

Statuts génériques possibles :

```txt
pending
uploaded
validated
rejected
deleted
quarantined
```

Visibilités génériques possibles :

```txt
private
public
signed
internal
```

Catégories génériques possibles :

```txt
image
document
avatar
media
video
audio
identity_document
attachment
other
```

La fondation ne définit pas de catégories métier spécifiques à un projet dérivé.

## 11. Stratégie stockage MinIO/S3

MinIO/S3 compatible est le stockage objet standard V1.

Principes :

- MinIO peut être utilisé en local ou auto-hébergé ;
- AWS S3 ou autre provider compatible peut être utilisé dans un projet dérivé ;
- le contrat fichier doit rester indépendant du provider ;
- les credentials restent hors Git ;
- l'accès direct public aux buckets est interdit par défaut ;
- les volumes, backups et restore sont cadrés par le Deployment.

## 12. Stratégie buckets

Les buckets doivent être privés par défaut.

La séparation peut se faire selon :

- projet ;
- environnement ;
- domaine fonctionnel ;
- sensibilité des fichiers ;
- stratégie de rétention.

Les policies doivent être documentées. Un bucket public ne peut être utilisé que si le besoin est explicite, justifié et validé.

## 13. Stratégie upload API

L'API Core NestJS contrôle l'upload.

Elle doit gérer :

- authentification ;
- autorisation ;
- validation fichier ;
- génération de `storageKey` ;
- metadata ;
- audit ;
- erreurs normalisées ;
- rate limiting sur endpoints sensibles ;
- génération éventuelle d'URLs signées ;
- suppression logique ou physique selon contexte.

Les clients ne décident pas seuls de la validité d'un fichier.

## 14. Stratégie URLs signées

Les URLs signées sont autorisées uniquement si elles sont nécessaires.

Règles :

- durée courte ;
- scope limité ;
- génération par API Core ;
- vérification des permissions avant génération ;
- pas d'URL signée permanente ;
- pas de logs contenant des URLs sensibles longues durées ;
- expiration ou révocation selon les capacités du provider ;
- usages documentés : lecture, téléchargement, upload direct contrôlé si validé plus tard.

## 15. Stratégie upload direct

L'upload direct client vers MinIO/S3 n'est pas le standard V1.

Il pourra être envisagé plus tard uniquement si les conditions suivantes sont réunies :

- besoin réel de gros fichiers ;
- besoin de performance documenté ;
- URLs signées limitées ;
- validation metadata côté API ;
- scan ou validation après upload ;
- permissions strictes ;
- ADR ou validation complémentaire.

Sans ces conditions, l'upload direct est interdit par défaut.

## 16. Stratégie validation fichiers

La validation backend est obligatoire.

Elle doit couvrir :

- taille maximale ;
- type MIME ;
- extension ;
- catégorie attendue ;
- cohérence entre MIME, extension et metadata ;
- nombre de fichiers si upload multiple ;
- permissions utilisateur ;
- quotas éventuels ;
- payloads et paramètres associés.

Le type MIME fourni par le client n'est pas une preuve suffisante. La validation frontend améliore l'UX mais ne remplace jamais la validation backend.

## 17. Stratégie metadata

Les metadata doivent être contrôlées par l'API.

Elles doivent permettre :

- rattachement à un utilisateur ou sujet ;
- catégorisation générique ;
- traçabilité du stockage ;
- statut de validation ;
- lifecycle ;
- audit ;
- affichage Web/Mobile cohérent.

Les noms de fichiers originaux sont conservés uniquement comme metadata. Ils ne doivent pas être utilisés comme clé de stockage fiable.

## 18. Stratégie permissions

L'API Core est l'autorité finale des permissions fichier.

Les permissions doivent couvrir :

- upload ;
- lecture ;
- téléchargement ;
- suppression ;
- génération d'URL signée ;
- accès à fichiers sensibles ;
- administration des fichiers si nécessaire.

Les clients Web/Mobile peuvent adapter l'UI selon les droits, mais ils ne constituent jamais la barrière de sécurité principale.

## 19. Stratégie sécurité fichier

Exigences obligatoires :

- buckets privés par défaut ;
- validation MIME type ;
- validation extension ;
- validation taille maximale ;
- noms fichiers non fiables ;
- `storageKey` générée côté serveur ;
- pas d'exécution de fichiers uploadés ;
- scan antivirus ou malware comme évolution possible ;
- URLs signées avec durée limitée ;
- audit logs sur upload, suppression et accès sensible ;
- permissions avant accès au fichier ;
- erreurs sans fuite de chemins internes ;
- logs sans secrets ni URLs sensibles longues durées ;
- suppression ou révocation d'accès si nécessaire ;
- protection contre upload massif ;
- rate limiting sur endpoints upload ;
- quotas éventuels par utilisateur ou projet.

Les documents sensibles doivent faire l'objet d'une politique d'accès plus stricte si un projet dérivé les active.

## 20. Stratégie lifecycle et suppression

Le lifecycle doit être documenté avant implémentation.

Points à cadrer :

- fichier en attente ;
- fichier validé ;
- fichier rejeté ;
- fichier mis en quarantaine ;
- suppression logique ;
- suppression physique ;
- rétention ;
- restauration éventuelle ;
- nettoyage des fichiers orphelins ;
- coordination avec backups.

La suppression d'un fichier sensible doit être auditée.

## 21. Stratégie audit logs

Les actions sensibles doivent produire des audit logs.

Actions minimales à auditer :

- upload ;
- validation ;
- rejet ;
- mise en quarantaine ;
- suppression ;
- génération d'URL signée ;
- accès à fichier sensible ;
- changement de visibilité ;
- modification de metadata critique.

Les audit logs ne doivent pas contenir de secret, token, credential ou URL signée longue durée.

## 22. Conséquences positives

- Stockage objet portable et compatible S3.
- API Core clairement responsable de la sécurité fichier.
- Buckets privés par défaut.
- Contrats fichiers réutilisables.
- Cohérence entre API, Cloud, Web, Mobile et UI Kit.
- Meilleure auditabilité.
- Migration possible vers provider S3 compatible.
- Réduction du risque de stockage local fragile.

## 23. Conséquences négatives

- Service MinIO/S3 à configurer et surveiller.
- Policies, credentials et backups à documenter.
- Contrats fichiers à maintenir.
- Upload direct gros fichiers non standard V1.
- Tests upload et permissions nécessaires.
- Discipline obligatoire sur URLs signées.

## 24. Risques

- Fichiers publics par erreur.
- Buckets mal configurés.
- Absence de validation backend.
- Confiance excessive dans le MIME type client.
- Noms fichiers dangereux.
- URLs signées trop longues.
- Upload massif ou abusif.
- Absence de quotas.
- Suppression non maîtrisée.
- Metadata incohérentes.
- Divergence entre clients Web/Mobile.
- Stockage de documents sensibles sans protection suffisante.
- Absence de stratégie backup/restore pour fichiers.

## 25. Alternatives rejetées

Le stockage local serveur est rejeté comme standard car il limite la portabilité, la scalabilité et la robustesse des backups.

L'upload direct client vers stockage est rejeté comme standard V1 car il réduit le contrôle API et demande une gouvernance stricte des URLs signées, metadata et validations post-upload.

Le provider cloud propriétaire obligatoire est rejeté car la fondation doit rester portable, auto-hébergeable et compatible avec plusieurs contextes projet.

## 26. Impact sur API Core NestJS

L'API Core NestJS doit prévoir un `UploadModule` responsable de :

- validation fichier ;
- permissions ;
- metadata ;
- stockage MinIO/S3 ;
- URLs signées ;
- erreurs normalisées ;
- rate limiting ;
- audit logs ;
- lifecycle.

Les modèles de persistance réels seront définis plus tard, sans exposer directement les détails de stockage comme contrat public non maîtrisé.

## 27. Impact sur Deployment

Le Deployment fournit le stockage objet.

Il doit cadrer :

- MinIO ou provider S3 compatible ;
- buckets privés ;
- credentials hors Git ;
- policies ;
- volumes persistants ;
- backups ;
- restore ;
- monitoring ;
- exposition réseau contrôlée.

MinIO ne doit pas être exposé publiquement sans justification.

## 28. Impact sur Mobile Core React Native

Le Mobile Core React Native doit utiliser `fetch + FormData` pour les uploads multipart conformément à ADR-011.

Règles mobiles :

- ne pas forcer manuellement `Content-Type: multipart/form-data` si cela casse le boundary ;
- gérer erreurs réseau ;
- gérer taille maximale côté client sans remplacer la validation backend ;
- justifier les permissions média/document ;
- prévoir progression upload si la stratégie technique le permet ;
- limiter les retries ;
- intégrer les erreurs avec les états UI.

## 29. Impact sur Web Core Next.js

Le Web Core Next.js doit prévoir :

- upload via wrapper HTTP ou formulaire contrôlé ;
- validation client pour l'expérience utilisateur ;
- validation backend obligatoire ;
- progression upload si nécessaire ;
- erreurs UI cohérentes ;
- absence de token sensible dans `localStorage` ;
- compatibilité cookies/CSRF selon ADR-005 ;
- intégration avec le `UploadModule` API.

## 30. Impact sur UI Kit

Le UI Kit doit prévoir des composants adaptables, sans imposer d'implémentation réelle dans cette ADR.

Composants et états concernés :

- `FileUploader` ;
- `ImagePicker UI` ;
- loading ;
- progress ;
- error ;
- success ;
- validation visuelle ;
- messages d'erreur accessibles ;
- drag and drop web éventuel ;
- preview si applicable ;
- adaptation web/mobile.

## 31. Impact sur ADR-011 Client HTTP

ADR-011 reste la référence pour le transport HTTP.

Cette ADR précise que :

- les uploads React Native utilisent `fetch + FormData` ;
- les wrappers HTTP doivent gérer erreurs, timeout et retries contrôlés ;
- la logique upload ne doit pas être dupliquée dans chaque feature ;
- les tokens et URLs sensibles ne doivent pas être loggés ;
- les URLs signées doivent être manipulées comme données sensibles.

## 32. Impact sur ADR-006 RBAC/Permissions

ADR-006 reste la référence pour l'autorisation.

Les permissions fichiers doivent être cohérentes avec RBAC + permissions fines.

Exemples génériques possibles :

```txt
files.upload
files.read
files.download
files.delete
files.sign_url
files.manage
```

Ces permissions restent génériques et peuvent être étendues par les projets dérivés via convention documentée.

## 33. Impact sur IA / Codex / Claude Code

Les agents IA doivent :

- respecter le périmètre strict ;
- ne pas créer de buckets, services ou code upload sans mission explicite ;
- ne pas exposer de secrets ;
- ne pas générer d'URLs signées réelles ;
- conserver l'API comme autorité ;
- utiliser les contrats fichiers comme référence ;
- signaler les risques de sécurité fichier ;
- demander une revue sécurité pour les changements sensibles.

L'IA assiste la génération et la revue, mais ne décide pas seule d'assouplir les règles de sécurité fichier.

## 34. Règles d'application

- API Core contrôle l'upload.
- Deployment fournit le stockage objet.
- Les buckets sont privés par défaut.
- La validation backend est obligatoire.
- Les clients Web/Mobile ne décident pas seuls de la validité d'un fichier.
- La `storageKey` est générée côté serveur.
- Les noms fichiers originaux sont conservés uniquement comme metadata.
- Les URLs signées sont courtes et contrôlées.
- Les permissions sont vérifiées avant accès.
- L'upload direct vers stockage est interdit par défaut en V1.
- Les logs ne contiennent ni secrets ni URLs sensibles.
- Les actions sensibles produisent des audit logs.
- Les contrats fichiers sont documentés.
- La suppression et le lifecycle sont documentés.

## 35. Conditions de révision future

Cette ADR devra être révisée si :

- les projets doivent gérer des fichiers très volumineux ;
- l'upload direct par URL signée devient nécessaire ;
- un provider propriétaire devient structurant ;
- un scan antivirus/malware devient obligatoire ;
- la réglementation impose une politique de conservation spécifique ;
- les besoins de CDN ou de diffusion publique deviennent centraux ;
- les coûts de stockage ou trafic changent fortement ;
- une stratégie de chiffrement objet doit être généralisée.

## 36. Conclusion

Enistere OS Foundation adopte MinIO/S3 compatible comme standard de stockage objet V1, avec l'API Core NestJS comme autorité d'upload, de validation, de metadata, de permissions et d'URLs signées.

Cette stratégie garde les fichiers privés par défaut, renforce la sécurité transverse et maintient la portabilité entre local, serveur dédié et cloud sans imposer un provider propriétaire.
