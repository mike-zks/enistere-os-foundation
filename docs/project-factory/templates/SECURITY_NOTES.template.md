# SECURITY_NOTES.md

> Projet derive : `<project-name>`.
> Statut : `DRAFT`.
> Date : `<YYYY-MM-DD>`.

## 1. Classification sécurité

| Sujet | Classification |
|---|---|
| Données personnelles | `<oui/non + détails>` |
| Données sensibles métier | `<oui/non + détails>` |
| Fichiers utilisateurs | `<oui/non + détails>` |
| Paiement | `<oui/non>` |
| Données santé/identité | `<oui/non>` |
| Public internet | `<oui/non>` |

## 2. Authentification

- Provider :
- Login :
- Refresh :
- Logout :
- MFA :
- Sessions web :
- Sessions mobile :

## 3. Autorisation

| Role | Permissions | Source d'autorité |
|---|---|---|
| `<role>` | `<permissions>` | `API` |

Rappel : l'UI peut masquer des actions, mais l'API reste toujours l'autorité.

## 4. Secrets

| Secret | Stockage prévu | Rotation |
|---|---|---|
| `<secret>` | `<env/secret manager/...>` | `<procédure>` |

Interdits :

- secret dans Git ;
- secret dans README ;
- token dans log ;
- URL signée persistée ;
- refresh token hors stockage sécurisé.

## 5. Données client

| Donnee | Sensible ? | Stockage | Loggable ? |
|---|---|---|---|
| `<donnee>` | `<oui/non>` | `<stockage>` | `non` |

## 6. Upload et fichiers

- Backend autoritatif pour MIME/taille/permissions :
- Stockage objet :
- URL signée :
- TTL :
- Quarantaine :
- Suppression :
- Anti-énumération :

## 7. Web security

- Cookies `HttpOnly` :
- CSRF :
- Origin/Referer :
- CSP :
- Open redirect :
- Headers sécurité :

## 8. Mobile security

- Access token en mémoire :
- Refresh token stockage sécurisé :
- Biométrie locale :
- Clipboard :
- Permissions OS :
- Stockage préférences non sensibles :

## 9. Logs et observabilité

- Logger :
- Redaction :
- Données interdites en log :
- RequestId/correlationId :
- Crash/analytics :
- Consentement :

## 10. Dépendances et supply chain

- Audit :
- Registry :
- Images :
- Lockfiles :
- Packages internes :

## 11. Gates sécurité V1

- [ ] `npm audit` / équivalent exécuté ;
- [ ] secrets absents du Git ;
- [ ] `.env.example` sans valeur réelle ;
- [ ] auth/RBAC revus ;
- [ ] upload revu si présent ;
- [ ] logs revus ;
- [ ] données sensibles documentées ;
- [ ] écarts Foundation documentés.

