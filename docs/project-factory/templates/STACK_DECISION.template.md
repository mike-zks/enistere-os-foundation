# STACK_DECISION.md

> Projet derive : `<project-name>`.
> Décision : `<stack-profile>`.
> Statut : `DRAFT`.
> Date : `<YYYY-MM-DD>`.

## 1. Décision

Le projet retient le profil :

```txt
<stack-profile>
```

## 2. Options évaluées

| Option | Verdict | Motif |
|---|---|---|
| `nestjs-next` | `<retenu/rejeté>` | `<motif>` |
| `spring-angular` | `<retenu/rejeté>` | `<motif>` |
| `nestjs-react-native` | `<retenu/rejeté>` | `<motif>` |
| `spring-flutter` | `<retenu/rejeté>` | `<motif>` |
| `<autre>` | `<retenu/rejeté>` | `<motif>` |

## 3. Justification

Expliquer pourquoi ce profil correspond le mieux :

- équipe ;
- contraintes métier ;
- canaux cibles ;
- exigences sécurité ;
- time-to-market ;
- compatibilité avec les cores V1 ;
- limites acceptées.

## 4. Compatibilité Foundation

| Dimension | Statut | Notes |
|---|---|---|
| API | `<DIRECT/ADAPT/DEFER/NO>` | `<notes>` |
| Web | `<DIRECT/ADAPT/DEFER/NO>` | `<notes>` |
| Mobile | `<DIRECT/ADAPT/DEFER/NO>` | `<notes>` |
| Cloud | `<DIRECT/ADAPT/DEFER/NO>` | `<notes>` |
| Quality | `<DIRECT/ADAPT>` | `<notes>` |
| Docs | `<DIRECT/ADAPT>` | `<notes>` |

## 5. Adaptations obligatoires

| Adaptation | Responsable | Avant V1 ? |
|---|---|---:|
| `<adaptation>` | `<role>` | `<oui/non>` |

## 6. Alternatives rejetées

| Alternative | Pourquoi rejetée |
|---|---|
| `<alternative>` | `<raison>` |

## 7. Risques acceptés

| Risque | Impact | Suivi |
|---|---|---|
| `<risque>` | `<impact>` | `<suivi>` |

## 8. Conditions de révision

La décision doit être revue si :

- le contrat API diverge ;
- le client requis n'existe pas ;
- un SDK natif devient obligatoire ;
- les gates V1 ne passent pas ;
- un besoin métier sort du profil retenu.

## 9. Validation

- [ ] option retenue cohérente avec `STACK_PROFILES_MATRIX.md` ;
- [ ] alternatives principales documentées ;
- [ ] adaptations explicites ;
- [ ] risques acceptés ;
- [ ] propriétaire projet validé.

