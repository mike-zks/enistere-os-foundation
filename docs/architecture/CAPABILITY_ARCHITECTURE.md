# Architecture des capabilities

## Classification

### Platform

- configuration ;
- health ;
- error model ;
- logging ;
- observability.

### Security

- authentication ;
- authorization ;
- user management ;
- audit.

### Integration

- files ;
- events ;
- notifications ;
- realtime ;
- search.

### Automation

- scheduler ;
- jobs ;
- workflow ;
- rules engine.

### Feature packs

Un feature pack assemble plusieurs capabilities sans les redéfinir.

```text
User Management Pack
├── Authentication
├── Authorization
├── User Profile
├── Audit
└── Admin UI
```

## Graphe initial

```text
Authorization → Authentication
User Management → Authentication + Authorization
Files → Authentication + Object Storage
Audit → Base Platform
Events → Base Platform
Notifications → Events + Mail/Push
Automation → Events + Scheduler + Audit
Observability → Base Platform
```

## Frontières

- une capability ne possède pas le domaine métier ;
- une primitive ne contient pas de cas d’usage ;
- un feature pack ne duplique pas les contrats ;
- un adapter client n’invente pas de règle serveur.

## Ordre de construction

1. Base Platform ;
2. Authentication ;
3. Authorization ;
4. User Management ;
5. Files ;
6. Audit ;
7. Events ;
8. Notifications ;
9. Observability ;
10. Automation.
