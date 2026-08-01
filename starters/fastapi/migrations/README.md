# Migrations

Le baseline porte l'outillage Alembic et la révision `0001_baseline`, qui crée le
puits d'audit métier — la table que les baselines NestJS et Spring créent elles
aussi dans leur migration initiale (ADR-080).

Chaque capability composée ajoute ses propres révisions, chaînées sur celle du
baseline : `0002_auth` pour les identités et sessions de rafraîchissement,
`0003_rbac` pour les rôles et permissions.

`env.py` énumère les modules de modèles à importer pour `--autogenerate`. C'est
une limite connue : une capability ajoutée plus tard y est invisible tant qu'elle
n'y figure pas. Le correctif propre est une couture de composition pour les
modules de modèles, pas un import en dur de plus.
